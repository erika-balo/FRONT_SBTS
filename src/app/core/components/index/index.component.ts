import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

import { EventosService, LotesService, SlidersService, BannersService, StreamingService } from 'app/services';

import { Store, select } from '@ngrx/store';
import { AppState, Login, currentUser } from 'app/store';

import { Subject, timer } from 'rxjs';
import { delay, filter, take, takeUntil } from 'rxjs/operators'

import * as moment from 'moment';
import * as _ from 'lodash';

import { environment } from 'app/../environments/environment';
import { io } from 'socket.io-client';
import Peer from 'peerjs';

@Component({
    selector: 'app-index',
    templateUrl: './index.component.html',
    styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit, OnDestroy {

	resourceUrl = environment.URL_IMAGENES;
	videoElement!: HTMLVideoElement;

    data: any;
	lotes: any[];
	bannerIndex: string;
	eventos: any[];
	eventoSeleccionado: number;
	nombreevento: string;
	tipo: string;

    page: number;
    limit: number;

    timers: any[];

	images: any[];

	user: any;

    private _unsubscribeAll: Subject<any>;
	private peer: Peer;
	private stream: MediaStream | null = null;

    constructor(
        private lotesService: LotesService,
        private domSanitizer: DomSanitizer,
        private store: Store<AppState>,
		private router: Router,
		private slidersService: SlidersService,
		private bannersService: BannersService,
		private cdr: ChangeDetectorRef,
		private eventosService: EventosService,
		private activatedRoute: ActivatedRoute,
		private socketService: StreamingService
    ) {
		this.peer = new Peer({
			host: '192.168.1.2', // Dirección del servidor de señalización
			port: 9000, // Puerto del servidor de señalización
			path: '/myapp', // Ruta del servidor de señalización
		  }); // Inicializar PeerJS

		this.peer.on('error', (error) => {
		  console.error('Error en PeerJS (espectador):', error);
		});
    }

    async ngOnInit(): Promise<void> {
		this.socketService.onStreamStarted((data: any) => {
			console.log('Transmisión iniciada por el host:', data.peerId);
			this.connectToHost(data.peerId);
		  });
        // this._unsubscribeAll = new Subject();
		// this.timers = [];
		// this.lotes = [];
        // this.images = [
        // ];

        // this.page = 1;
        // this.limit = 5;

		// this.loadSliders();
		// this.loadBanners();

		// this.store.pipe(
		// 	takeUntil(this._unsubscribeAll),
		// 	select(currentUser),
		// 	filter(user => user)
		// ).subscribe(user => {
		// 	this.user = user;
		// });

		// this.activatedRoute.queryParams.subscribe(params => {
		// 	this.lotes = [];
		// 	this.timers = [];
		// 	if (params.tipo) {
		// 		this.tipo = params.tipo;
		// 		switch (this.tipo) {
		// 			case 'past':
		// 				this.loadEventosPast();
		// 				break;
		// 			case 'future':
		// 				this.loadEventosFuture();
		// 				break;
		// 		}
		// 	} else {
		// 		if (params.eventoId) {
		// 			this.eventoSeleccionado = params.eventoId;
		// 			this.load();
		// 		} else {
		// 			this.tipo = 'current';
		// 			this.loadEventosFuture();
		// 		}
		// 	}
		// });
	}

	async connectToHost(hostPeerId: string) {
		const stm2 = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
		const call = this.peer.call(hostPeerId, stm2); // No necesitas pasar `this.stream`\
		  call.on('stream', (remoteStream) => {
			console.log('Recibiendo stream del host...');
			
			const videoElement = document.getElementById('viewer-video') as HTMLVideoElement;
			videoElement.srcObject = remoteStream;
		  });
	
		  call.on('error', (error) => {
			console.error('Error en la llamada:', error);
		  });
	  }
	loadEventosPast(): void {
		const now = moment().format('YYYY-MM-DD') + ' 00:00:00';
		this.eventosService.findPast(now).subscribe(response => {
			this.eventos = response.body;
			if (this.eventos.length > 0) {
				this.eventoSeleccionado = this.eventos[0].id;
				this.load();
			}
		},
		err => {
			console.log(err);
		});
	}

	loadEventosFuture(): void {
		const now = moment().format('YYYY-MM-DD') + ' 00:00:00';
		this.eventosService.findFuture(now).subscribe(response => {
			this.eventos = response.body;
			if (this.eventos.length > 0) {
				this.eventoSeleccionado = this.eventos[0].id;
				this.load();
			}
		},
		err => {
			console.log(err);
		});
	}

	loadEventosCurrent(): void {
		const now = moment().format('YYYY-MM-DD') + ' 00:00:00';
		this.eventosService.findCurrent(now).subscribe(response => {
			this.eventos = response.body;
			if (this.eventos.length > 0) {
				this.eventoSeleccionado = this.eventos[0].id;
				this.load();
			}
		},
		err => {
			console.log(err);
		});
	}

	onChangeEvento(event: any): void {
		this.eventoSeleccionado = event.target.value;
		console.log(this.eventoSeleccionado);
		this.page = 1;
		this.load(true);
	}
	
	loadSliders(): void {
		this.slidersService.findAll().subscribe(response => {
			const data = response.body;
			this.images = data;
		},
		err => {
			console.log(err);
		});
	}

	loadBanners(): void {
		this.bannersService.findAll().subscribe(response => {
			const data = response.body;
			data.forEach(dat => {
				if (dat.slug === 'INDEX_TOP') {
					this.bannerIndex = dat.archivoImagen.Location;
				}
			});
		},
		err => {
			console.log(err);
		});
	}


    load(reload: boolean = false): void {
		if (this.eventoSeleccionado && this.page > 0) {
			this.lotesService.allPaginate(this.eventoSeleccionado, this.page, this.limit).subscribe(response => {
				this.data = response.body;
				if (reload) {
					this.lotes = this.data.items;
				} else {
					this.lotes = this.lotes.concat(this.data.items);
				}
				this.timers.forEach(timer => {
					timer.unsubscribe();
				});
				this.timers = [];
				this.timerSubastas(this.lotes);
			},
			err => {
				console.log(err);
			});
		}
    }

    checkIsInPista(item: any): boolean {
        let res = false;

		if (item.lastSubasta) {
			if ((item.lastSubasta.estatus === 'ABIERTO' || item.lastSubasta.estatus === 'EN_PISTA') && item.lastSubasta.activo) {
				res = true;
			}
		}

        return res;
    }

    pujaAqui(item: any): void {
        this.router.navigate(['/subastas/en-pista', item.lastSubasta.id]);
	}
	
	redirectCatalogo(): void {
		window.open('https://online.fliphtml5.com/utfja/flpl/#p=6', '_blank');
	}

    timerSubastas(lotes: any[]) {
        lotes.forEach((lote, index) => {
			const subasta = lote.lastSubasta;
            if (subasta && (subasta.estatus === 'ABIERTO' || subasta.estatus === 'EN_PISTA')) {
				this.setContador(subasta.fechaFin, index);
            // } else if (subasta && subasta.estatus === 'CREADA') {
			// 	this.setContador(subasta.fechaInicio, index);
			}
        });
	}
	
	setContador(fecha: any, index: number): void {
		const now = moment();
		const newHora = moment(fecha);
		const diff = newHora.diff(now, 'seconds');
		this.lotes[index].tiempo = diff;
		const duration = moment.duration({ 'seconds': this.lotes[index].tiempo });
		const days = duration.days().toString();
		const hours = duration.hours().toString();
		const minutes = duration.minutes().toString();
		const seconds = duration.seconds().toString();
		this.lotes[index].tiempoFormat = (days.length < 2 ? '0' + days : days) + ':' + (hours.length < 2 ? '0' + hours : hours) + ':' + (minutes.length < 2 ? '0' + minutes : minutes) + ':' + (seconds.length < 2 ? '0' + seconds : seconds);

		const time = timer(1000, 1000)
			.pipe(takeUntil(this._unsubscribeAll))
			.subscribe(res => {
				this.lotes[index].tiempo--;
				const duration = moment.duration({ 'seconds': this.lotes[index].tiempo });
				const days = duration.days().toString();
				const hours = duration.hours().toString();
				const minutes = duration.minutes().toString();
				const seconds = duration.seconds().toString();
				this.lotes[index].tiempoFormat = (days.length < 2 ? '0' + days : days) + ':' + (hours.length < 2 ? '0' + hours : hours) + ':' + (minutes.length < 2 ? '0' + minutes : minutes) + ':' + (seconds.length < 2 ? '0' + seconds : seconds);
				if (this.lotes[index].tiempo <= 0) {
					time.unsubscribe();
				}
			});

		this.timers.push(time);
	}

    onPageChange(event: any): void {
        this.page = event;
        this.load();
    }

    sanitizeImagen(imagen: any): any {
        return this.domSanitizer.bypassSecurityTrustResourceUrl('data:' + imagen.fotoPortadaContentType + ';base64,' + imagen.fotoPortada);
	}
	
	onScroll(): void {
		this.page = this.page + 1;
		this.onPageChange(this.page);
	}

  selectEvento(eventoId: number): void {
    this.eventoSeleccionado = eventoId;
    this.page = 1;
    this.load(true);
  }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

}
