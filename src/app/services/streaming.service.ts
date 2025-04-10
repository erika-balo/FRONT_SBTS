import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class StreamingService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://192.168.1.2:3000'); // Conectar al servidor de Express
  }

  // Escuchar eventos del servidor
  onStreamStarted(callback: (streamData: any) => void) {
    this.socket.on('stream-started', callback);
  }

  onStreamStopped(callback: (streamData: any) => void) {
    this.socket.on('stream-stopped', callback);
  }

  onStreamInProcess(callback: (streamData: any) => void) {
    this.socket.on('in_streaming', callback);
  }

  // Emitir evento para iniciar la transmisión
  startStream(streamData: any) {
    this.socket.emit('start-stream', streamData);
  }

  
  // Emitir evento para iniciar la transmisión
  stopStream(streamData: any) {
    this.socket.emit('stop-streaming', streamData);
  }

  
}
