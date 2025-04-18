import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StreamingService {
  private socket: Socket;

  constructor() {

    this.socket = io('wss://127.0.0.1:3000', {  // Cambia ws:// a http:// 
      path: '/socket.io',  // Usa http en lugar de wss
      secure: false,  // Asegúrate que está en false para desarrollo
      rejectUnauthorized: false,  // Solo para desarrollo
      transports: ['websocket']
    });
  }

  // Escuchar eventos del servidor
  onStreamStarted(callback: (streamData: any) => void) {
    this.socket.on('stream-started', callback);
  }

  // Emitir evento para iniciar la transmisión
  startStream(streamData: any) {
    this.socket.emit('start-stream', streamData);
  }

  
  // Emitir evento para iniciar la transmisión
  stopStream(streamData: any) {
    this.socket.emit('start-stream', streamData);
  }
}