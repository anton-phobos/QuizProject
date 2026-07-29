"use client"

import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io({ transports: ["websocket", "polling"] })
  }
  return socket
}

export const ANSWER_STYLES = [
  { bg: "bg-answer-1", ring: "ring-answer-1" },
  { bg: "bg-answer-2", ring: "ring-answer-2" },
  { bg: "bg-answer-3", ring: "ring-answer-3" },
  { bg: "bg-answer-4", ring: "ring-answer-4" },
]
