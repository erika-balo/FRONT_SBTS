import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ToastService, LotesService, SubastasDetallesService, SubastasService } from 'app/services';
import { delay, filter, take, takeUntil } from 'rxjs/operators'
import { Subject, timer } from 'rxjs';
import { AppState, currentUser, Logout } from 'app/store';
import { Store, select } from '@ngrx/store';
import * as _ from 'lodash';
import { ConfirmacionComponent } from 'app/core/components/generales/confirmacion/confirmacion.component';
import { environment } from 'app/../environments/environment';

@Component({
        selector: 'app-page-contact-detail',
        templateUrl: './page-contact-detail.component.html',
        styleUrls: ['./page-contact-detail.component.css']
})
export class PageContactDetailComponent implements OnInit {

        resourceUrl = environment.URL_IMAGENES;
        /*variables inicio*/
        diferenciaMinimaOferta: number;
        proximaMinimaOferta: number;
        subasta: any;
        pujaForm: FormGroup;
        user:any;
        subastaId: number;
        topicSubasta: string;
        isUser: boolean;
        subastaEnPista: boolean;
        subastasDetalles: any[];
        isSubasta: boolean;
        /*variables fin*/
        loteId: number;
        isActiva: boolean;

        lote: any;
        lastPuja: any;
        lastSubasta: any;
        viewerOpen: boolean[];
        subastaDetalles: any[];
        private _unsubscribeAll: Subject<any>;

        constructor(
        private activatedRoute: ActivatedRoute,
                private lotesService: LotesService,
                private subastasDetallesService: SubastasDetallesService,
                private subastasService: SubastasService,
                private domSanitizer: DomSanitizer,
                private modalService: NgbModal,
                private _fb: FormBuilder,
                private store: Store<AppState>,
                private toastService: ToastService,
                private chdr: ChangeDetectorRef,
                private router: Router
        ) {
        }
ngOnInit(): void {
                this.load();
		
                this.createForm();
                this._unsubscribeAll = new Subject();
               const url = new URL(environment.MERCURE_URL);
                url.searchParams.append('topic', 'change-en-pista');
                const eventSource = new EventSource(url.toString());
                eventSource.onmessage = e => {
                        console.log(e)
			window.location.reload();
                        this.load();
                };
                /*prueba*/
                
	this.store.pipe(
	takeUntil(this._unsubscribeAll),
	select(currentUser),
	filter(user => user)
).subscribe(user => {
	this.user = user;
	this.isSubasta = user.roles.indexOf('ROLE_SUBASTA') >= 0;
	this.isUser = user.roles.indexOf('ROLE_USER') >= 0;

	if (this.isUser) {
			const url = new URL(environment.MERCURE_URL);
			url.searchParams.append('topic', 'user-' + this.user.id);

			const eventSource = new EventSource(url.toString());
			eventSource.onmessage = e => {
					const data = JSON.parse(e.data);
					if (data.accion === 'logout') {
							this.store.dispatch(new Logout());
							this.router.navigate(['/']);
					}
			};
	}
});		
                /*fin*/
        }
	 load(): void {
                this.subastasService.getEnPista().subscribe(response => {
                        const data = response.body;
                        console.log(data);
                        if (data) {
                                this.lote = data.lote;
                                this.lastSubasta = data;
                                this.topicSubasta = 'topic-subasta-' + this.lastSubasta.id;
                                const url = new URL(environment.MERCURE_URL);
                                url.searchParams.append('topic', this.topicSubasta);
                                const eventSource = new EventSource(url.toString());
                                eventSource.onmessage = e => {
                                        const data = JSON.parse(e.data);
                                        if (data.accion === 'puja') {
                                                this.loadDetalles();
                                        } else if (data.accion === 'vendida') {
                                                this.hola();
                                        } else if (data.accion === 'cerrar') {
                                                this.hola();
                                        } else if (data.accion === 'invalidar') {
                                                this.loadDetalles();
                                        } else if (data.accion === 'validar') {
                                                this.hola();
                                        }else if (data.accion === 'subasta-activa') {
                                                this.hola();
                                        } else if (data.accion === 'subasta-inactiva') {
                                                this.hola();
                                        }
                                };
                                this.loadDetalles();


                        }
                },
                err => {
                        console.log(err);
                });
        }
        /*inicio*/
        hola(): void {
                this.subastasService.findOneCompleto(this.lastSubasta.id).subscribe(response => {
                        this.lastSubasta = response.body;
                        this.diferenciaMinimaOferta = this.lastSubasta.diferenciaMinimaOferta;
                        this.loadDetalles();
                },
                err => {
                        console.log(err);
                });
        }
        /*fin*/

loadDetalles(): void {
                this.subastasDetallesService.getDetallesLimit(this.lastSubasta.id).subscribe(response => {
                        this.subastasDetalles = response.body;
			console.log(this.subastasDetalles);
                        this.lastPuja = _.first(this.subastasDetalles);
                        if (this.subastasDetalles.length > 0) {
                                this.proximaMinimaOferta = +this.lastPuja.monto + +this.lastSubasta.diferenciaMinimaOferta;
                        } else {
                                this.proximaMinimaOferta = +this.subasta.precioSalida  + +this.lastSubasta.diferenciaMinimaOferta;
                        }
                        this.chdr.detectChanges();
		
                },
                err => {
                        console.log(err);
                });
        }
/*inicio*/	
        isEnPista(): boolean {
                return this.lastSubasta && (this.lastSubasta.estatus === 'EN_PISTA');
        }

	msNolote(): boolean {
		return this.subasta && (this.subasta.estatus === null);
	}	
	msvendido(): boolean{
		return this.lastSubasta && (this.lastSubasta.estatus === 'VENDIDA')
	}
createForm(): void {
        this.pujaForm = this._fb.group({
            monto: [null, Validators.required],
                });
        }

        validDiferenciaPuja(): void {
                const control = this.pujaForm['controls'].monto;
                const value = control.value;

                let ultimoMonto;
                if (this.lastPuja) {
                        ultimoMonto = this.lastPuja.monto;
                } else {
                        ultimoMonto = this.lastSubasta.precioSalida;
                }

                const diff = value - ultimoMonto;
                if (diff < this.lastSubasta.diferenciaMinimaOferta) {
                        control.markAllAsTouched();
                        control.setErrors({ 'diferenciaMinimaOferta': true });
                } else {
                        control.markAllAsTouched();
                        control.setErrors(null);
                }
        }

 pujaAqui(): void {
        this.router.navigate(['/auth-login'], { queryParams: { redirectUrl: '/trans' + this.lastSubasta.id }});
        }

        get form(): any {
                return this.pujaForm['controls'];
        }

        cantidadFija(cantidad: number): void {
                let ultimoMonto = 0;
                if (this.lastPuja) {
                        ultimoMonto = this.lastPuja.monto;
                } else {
                        ultimoMonto = this.lastSubasta.precioSalida;
                }

                const total = +cantidad + +ultimoMonto;
                this.pujaForm['controls'].monto.setValue(total);
                this.onSubmit();
        }

	reload(){
  	// any other execution
  	window.location.reload();

	}

	/**puja aqui inicio*/
	openinfo(): void {
		this.router.navigate(['/subastas/en-pista', this.lastSubasta.id]);
	} 
	
	openVideo(): void {
		window.open(this.lastSubasta.lote.linkYoutube, '_blank');
	}

	/**puja aqui fin*/



    onSubmit(): void {
                this.checkIsLogin();
                this.validDiferenciaPuja();
                if (this.pujaForm.valid && this.user) {
                        const modalRef = this.modalService.open(ConfirmacionComponent);
                        modalRef.componentInstance.texto = '¿Desea registrar esta puja?';
                        modalRef.result.then(result => {
                                if (result.res) {
                                        this.registrarPuja();
                                }
                        });
                }
        }

 checkIsLogin(): void {
                if (!this.user) {
                        const modalRef = this.modalService.open(ConfirmacionComponent);
                        modalRef.componentInstance.texto = 'Para hacer pujas necesitas iniciar sesión con un usuario registrado en el portal';
                        modalRef.result.then(result => {
                                if (result.res) {
                                        this.pujaAqui();
                                }
                        });
                }
        }
  registrarPuja(): void {
                const params = this.pujaForm.value;
                params.topic = this.topicSubasta;
                params.data = { accion: 'puja' };
                params.tipo = this.isUser ? 'INTERNET' : 'PISO';
                this.subastasDetallesService.save(this.lastSubasta.id, params).subscribe(response => {
                        this.loadDetalles();
                        this.pujaForm.reset();
                        this.toastService.success('Puja registrada correctamente');
                },
                err => {
                        console.log(err);
                        if (err.status === 409) {
                                this.toastService.error(err.error.message);
                        }
                });
        }

        formatCantidad(cantidad: string): string {
                return parseFloat(cantidad).toFixed(2);
        }



/*fin*/






    sanitizeImagen(imagen: any): any {
        return this.domSanitizer.bypassSecurityTrustResourceUrl('data:' + imagen.contentType + ';base64,' + imagen.base64);
        }

}

