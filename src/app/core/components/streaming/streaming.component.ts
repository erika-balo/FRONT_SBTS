import { Component, OnInit } from "@angular/core";
import { StreamingService } from "app/services";
import { environment } from "environments/environment";
import Peer from "peerjs";
import { UsersService } from '../../../services/users.service';
import { ConfigGeneralesService } from '../../../services/config-generales.service';

@Component({
    selector: 'app-streaming',
    templateUrl: './streaming.component.html',
    styleUrls: ['./streaming.component.scss']
})
export class StreamingComponent implements OnInit {

    private peer: Peer;
    private stream: MediaStream | null = null;
    idTransmition = '';


    videoDevices: MediaDeviceInfo[] = [];
    selectedDeviceId: string | null = null;
    selectedCamera !: string;
    public isStreaming: boolean = false;

    constructor(
        // private socketService: StreamingService,
        private configGeneralesService: ConfigGeneralesService,
        public UsersService: UsersService
    ) { 
            this.peer = new Peer({
                host: 'streaming.digitalganadera.com', // Dirección del servidor de señalización
                secure: true, // Cambia a true si usas HTTPS           
                path: '/peer/myapp', // Ruta del servidor de señalizacións
              }); // Inicializar PeerJSs
            this.peer.on('open', (id) => {
              console.log('ID del host:', id);
            });
            console.log('ID del host:', this.peer.id);
            
        
            // Escuchar llamadas entrantes de los espectadores
            this.peer.on('call', (call) => {
                console.log('Llamada entrante de:', call.peer);
                
              if (this.stream) {
                call.answer(this.stream); // Responder con el stream del host
                call.on('stream', (remoteStream) => {
                  // No necesitas hacer nada aquí, ya que el host no necesita ver el stream del espectador
                });
              } else {
                console.error('No hay stream disponible para responder la llamada.');
              }
            });

    }

    ngOnInit(): void {

        // Obtener la lista de dispositivos de video disponibles
        this.requestCameraPermissions();
    }

    async requestCameraPermissions() {
        try {
          // Pedimos acceso a la cámara sin usarla solo para obtener permisos
          await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          this.getVideoDevices();
        } catch (error) {
          console.error("No se pudieron obtener permisos para la cámara:", error);
        }
      }

    async getVideoDevices() {
        try {
            console.log('Obteniendo dispositivos de video...');

            const devices = await navigator.mediaDevices.enumerateDevices();
            this.videoDevices = devices.filter(device => device.kind === 'videoinput');
            if (this.videoDevices.length > 0) {
                this.selectedDeviceId = this.videoDevices[0].deviceId;
                this.selectedCamera = this.videoDevices[0].deviceId;
            }
            
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: this.selectedDeviceId ? { exact: this.selectedDeviceId} : undefined },
                audio: true,
            });
            const videoElement = document.getElementById('host-video') as HTMLVideoElement;
            videoElement.srcObject = this.stream;
        } catch (error) {
            console.error('Error al obtener dispositivos de video:', error);
        }
    }

    async onCameraChange(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.selectedDeviceId = selectElement.value;

        this.stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: this.selectedCamera ? { exact: this.selectedCamera } : undefined },
            audio: true,
          });
          const videoElement = document.getElementById('host-video') as HTMLVideoElement;
          videoElement.srcObject = this.stream;
    }

    async startStream() {
        try {
            // // Iniciar el stream
            // this.stream = await navigator.mediaDevices.getUserMedia({
            //     video: { deviceId: this.selectedCamera ? { exact: this.selectedCamera } : undefined },
            //     audio: true,
            // });
            
            // // Mostrar el stream localmente
            // const videoElement = document.getElementById('host-video') as HTMLVideoElement;
            // if (videoElement) {
            //     videoElement.srcObject = this.stream;
            // }
    
            this.idTransmition = this.peer.id;
            this.configGeneralesService.edit(17, { valor: this.idTransmition }).subscribe((res) => {
              console.log(res);
            }, err => {
              console.log(err);
            });

            this.isStreaming = true;
              this.UsersService.mercureAdvice('transmition', this.peer.id).subscribe((res) => {
                  console.log(res);
              }
            );
            // this.socketService.startStream({ peerId: this.peer.id });
        } catch (error) {
            console.error('Error al acceder a la cámara:', error);
        }
    }


    stopStream() {
        // Detener el envío del stream a otros peers, pero no detener el stream local
        if (this.peer) {
            // this.peer.disconnect(); // Esto corta la conexión de Peer pero no el stream local
            console.log('Se ha detenido la transmisión a otros usuarios');
        }
    
        // No tocamos el stream local ni el video, ya que queremos que siga visible
        this.isStreaming = false;
        this.configGeneralesService.edit(17, { valor: '0' }).subscribe((res) => {
          console.log(res);
          
        }, err => {
          console.log(err);
        });

        
        this.UsersService.mercureAdvice('transmition', 'close').subscribe((res) => {
          console.log(res);
        });
    
        // Detener la transmisión en el servidor (si es necesario)
        // if (this.socketService) {
        //     this.socketService.stopStream({ peerId: this.peer.id });
        //     console.log('Transmisión detenida en el servidor');
        // }
    }

}