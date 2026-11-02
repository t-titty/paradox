import { useEffect, useRef, useState } from "react";
import type {
  AcknowledgementDTO,
  DuelMessageDTO,
  DuelSnapshotDTO,
  EndReason,
  MatchmakingStatus,
  SynthesisStateDTO,
} from "../../../lib/duelTypes.ts";
import { getSocket, type DuelSocket } from "../../../lib/socket.ts";
import { DuelLobby } from "./DuelLobby.tsx";
import { DuelRoom } from "./DuelRoom.tsx";
import { DuelEnded } from "./DuelEnded.tsx";

type Flow =
  | { kind: "lobby"; status: MatchmakingStatus; banner: string | null; notice?: string | null }
  | { kind: "in_duel"; snapshot: DuelSnapshotDTO; synthesis: SynthesisStateDTO }
  | { kind: "ended"; snapshot: DuelSnapshotDTO; reason: EndReason; synthesis: SynthesisStateDTO };

const EMPTY_SYNTHESIS: SynthesisStateDTO = { kind: "none" };

/**
 * Phase IV/V flow orchestrator. Owns socket subscription lifecycle and
 * dispatches to the right sub-view. Synthesis state travels with the duel
 * snapshot so DuelEnded can render the sign/decline panel.
 */
interface DuelFlowProps {
  /** "practice" auto-starts the first-run practice spar. */
  variant?: "daily" | "practice";
  /** Told when the player enters or leaves a live duel (the page switches tabs). */
  onActiveChange?: (active: boolean) => void;
  /** Practice: called when the player is done with the post-duel screen. */
  onPracticeDone?: () => void;
}

export function DuelFlow({ variant = "daily", onActiveChange, onPracticeDone }: DuelFlowProps = {}) {
  const socketRef = useRef<DuelSocket | null>(null);
  const [flow, setFlow] = useState<Flow>({ kind: "lobby", status: { state: "idle" }, banner: null });
  const [notice, setNotice] = useState<string | null>(null);
  const flowKindRef = useRef<Flow["kind"]>("lobby");

  useEffect(() => {
    flowKindRef.current = flow.kind;
    onActiveChange?.(flow.kind !== "lobby");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.kind]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onStatus = (status: MatchmakingStatus) => {
      setFlow((prev) => {
        if (prev.kind !== "lobby") return prev;
        return { kind: "lobby", status, banner: prev.banner };
      });
    };

    const onMatched = (snapshot: DuelSnapshotDTO) => {
      setFlow({ kind: "in_duel", snapshot, synthesis: EMPTY_SYNTHESIS });
    };

    const onSnapshot = (snapshot: DuelSnapshotDTO) => {
      setFlow((prev) => {
        if (prev.kind === "ended") {
          return { ...prev, snapshot };
        }
        const carried = prev.kind === "in_duel" ? prev.synthesis : EMPTY_SYNTHESIS;
        return { kind: "in_duel", snapshot, synthesis: carried };
      });
    };

    const onMessage = (msg: DuelMessageDTO) => {
      setFlow((prev) => {
        if (prev.kind !== "in_duel" && prev.kind !== "ended") return prev;
        const snap = prev.snapshot;
        const existingIdx = snap.messages.findIndex((m) => m.id === msg.id);
        const nextMessages =
          existingIdx >= 0
            ? snap.messages.map((m, i) => (i === existingIdx ? msg : m))
            : [...snap.messages, msg];
        const nextSnap = { ...snap, messages: nextMessages };
        return prev.kind === "in_duel"
          ? { ...prev, snapshot: nextSnap }
          : { ...prev, snapshot: nextSnap };
      });
    };

    const onPhaseChange = (payload: {
      mode: DuelSnapshotDTO["mode"];
      nextTransitionAt: string | null;
    }) => {
      setFlow((prev) => {
        if (prev.kind !== "in_duel") return prev;
        return {
          ...prev,
          snapshot: { ...prev.snapshot, mode: payload.mode, nextTransitionAt: payload.nextTransitionAt },
        };
      });
    };

    const onAckUpdate = (payload: { acknowledgements: AcknowledgementDTO[] }) => {
      setFlow((prev) => {
        if (prev.kind !== "in_duel") return prev;
        return { ...prev, snapshot: { ...prev.snapshot, acknowledgements: payload.acknowledgements } };
      });
    };

    const onExtensionUpdate = (payload: { extensionRequests: string[]; granted: boolean }) => {
      setFlow((prev) => {
        if (prev.kind !== "in_duel") return prev;
        return { ...prev, snapshot: { ...prev.snapshot, extensionRequests: payload.extensionRequests } };
      });
    };

    const onEnded = (payload: { duelId: string; reason: EndReason; endedAt: string }) => {
      setFlow((prev) => {
        if (prev.kind === "lobby") return prev;
        return {
          kind: "ended",
          snapshot: { ...prev.snapshot, endedAt: payload.endedAt },
          reason: payload.reason,
          synthesis: prev.kind === "ended" ? prev.synthesis : prev.synthesis,
        };
      });
    };

    const onSynthesisUpdate = (payload: { duelId: string; state: SynthesisStateDTO }) => {
      setFlow((prev) => {
        if (prev.kind === "lobby") return prev;
        return { ...prev, synthesis: payload.state };
      });
    };

    const onError = (payload: { code: string; message: string }) => {
      setFlow((prev) => {
        if (prev.kind !== "lobby") return prev;
        return { kind: "lobby", status: prev.status, banner: payload.message };
      });
      // In-duel errors (e.g. "questions only") surface as a transient notice.
      if (flowKindRef.current !== "lobby") setNotice(payload.message);
    };

    const onNotice = (payload: { code: string; message: string }) => {
      setNotice(payload.message);
    };

    socket.on("matchmaking:status", onStatus);
    socket.on("matchmaking:matched", onMatched);
    socket.on("duel:snapshot", onSnapshot);
    socket.on("duel:message", onMessage);
    socket.on("duel:phase_change", onPhaseChange);
    socket.on("duel:acknowledge_update", onAckUpdate);
    socket.on("duel:extension_update", onExtensionUpdate);
    socket.on("duel:ended", onEnded);
    socket.on("synthesis:update", onSynthesisUpdate);
    socket.on("duel:error", onError);
    socket.on("duel:notice", onNotice);

    if (variant === "practice") {
      // Reconnects re-send a snapshot if a practice duel is already live.
      socket.emit("matchmaking:practice");
    }

    return () => {
      socket.off("matchmaking:status", onStatus);
      socket.off("matchmaking:matched", onMatched);
      socket.off("duel:snapshot", onSnapshot);
      socket.off("duel:message", onMessage);
      socket.off("duel:phase_change", onPhaseChange);
      socket.off("duel:acknowledge_update", onAckUpdate);
      socket.off("duel:extension_update", onExtensionUpdate);
      socket.off("duel:ended", onEnded);
      socket.off("synthesis:update", onSynthesisUpdate);
      socket.off("duel:error", onError);
      socket.off("duel:notice", onNotice);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  function joinQueue() {
    socketRef.current?.emit("matchmaking:join");
  }

  function spar() {
    socketRef.current?.emit("matchmaking:spar");
  }

  function practiceAgain() {
    socketRef.current?.emit("matchmaking:practice");
  }

  function report(reason: string, note?: string) {
    if (flow.kind === "lobby") return;
    socketRef.current?.emit("duel:report", { duelId: flow.snapshot.duelId, reason, note });
  }

  function leaveQueue() {
    socketRef.current?.emit("matchmaking:leave");
    setFlow({ kind: "lobby", status: { state: "idle" }, banner: null });
  }

  function sendMessage(text: string) {
    if (flow.kind !== "in_duel") return;
    socketRef.current?.emit("duel:message", { duelId: flow.snapshot.duelId, text });
  }

  function sendAcknowledgement(text: string) {
    if (flow.kind !== "in_duel") return;
    socketRef.current?.emit("duel:acknowledge", { duelId: flow.snapshot.duelId, text });
  }

  function requestExtension() {
    if (flow.kind !== "in_duel") return;
    socketRef.current?.emit("duel:request_extension", { duelId: flow.snapshot.duelId });
  }

  function signSynthesis() {
    if (flow.kind !== "ended") return;
    socketRef.current?.emit("synthesis:sign", { duelId: flow.snapshot.duelId });
  }

  function declineSynthesis() {
    if (flow.kind !== "ended") return;
    socketRef.current?.emit("synthesis:decline", { duelId: flow.snapshot.duelId });
  }

  function returnToLobby() {
    setFlow({ kind: "lobby", status: { state: "idle" }, banner: null });
  }

  const toast = notice ? (
    <div
      role="status"
      className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-md border-2 border-gold bg-ink px-4 py-3 text-center font-mono text-xs uppercase tracking-brutal text-gold md:bottom-8"
    >
      {notice}
    </div>
  ) : null;

  if (flow.kind === "lobby") {
    if (variant === "practice") {
      return (
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="brutal-heading text-xl text-gold">SUMMONING YOUR SPARRING PARTNER...</p>
          {flow.banner && <p className="mt-4 font-mono text-sm text-blood">{flow.banner}</p>}
          {flow.banner && (
            <button onClick={practiceAgain} className="brutal-btn brutal-btn-gold mt-6">
              TRY AGAIN
            </button>
          )}
        </div>
      );
    }
    return (
      <>
        <DuelLobby
          status={flow.status}
          banner={flow.banner}
          onJoin={joinQueue}
          onLeave={leaveQueue}
          onSpar={spar}
        />
        {toast}
      </>
    );
  }

  if (flow.kind === "in_duel") {
    return (
      <>
        <DuelRoom
          snapshot={flow.snapshot}
          onSendMessage={sendMessage}
          onAcknowledge={sendAcknowledgement}
          onRequestExtension={requestExtension}
          onReport={report}
        />
        {toast}
      </>
    );
  }

  return (
    <>
      <DuelEnded
        snapshot={flow.snapshot}
        reason={flow.reason}
        synthesis={flow.synthesis}
        onSign={signSynthesis}
        onDecline={declineSynthesis}
        onReturn={variant === "practice" && onPracticeDone ? onPracticeDone : returnToLobby}
        onReport={report}
      />
      {toast}
    </>
  );
}
