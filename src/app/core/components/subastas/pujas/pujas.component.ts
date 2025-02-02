import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ConfirmacionComponent } from 'app/core/components/generales/confirmacion/confirmacion.component';
import { SubastasDetallesService, SubastasService, ToastService } from 'app/services';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'app/../environments/environment';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
    selector: 'app-subasta-pujas',
    templateUrl: './pujas.component.html',
})
export class SubastasVerPujasComponent implements OnInit {

        subastaId: number;
	detalle: any;
	detalles: any[];
	pdfDefinition: any[];
        page: number;
	pageSize: number;
	lote: any;
	topicSubasta: string;
	subastaEstatus: boolean;
	busquedaForm: FormGroup;

    sortedField: string;
    sortedType: string;

	numerolote: any;

	
    constructor(
        private _fb: FormBuilder,
        private activatedRoute: ActivatedRoute,
		private subastasDetallesService: SubastasDetallesService,
		private modalService: NgbModal,
		private toastService: ToastService,
		private subastasService: SubastasService,
		private chdr: ChangeDetectorRef
    ) {
    }

    ngOnInit(): void {
        this.page = 1;
		this.pageSize = 10;

        this.activatedRoute.params.subscribe(params => {
			this.subastaId = +params['subastaId'];
			this.topicSubasta = 'topic-subasta-' + this.subastaId;
			this.createForm();

			this.load();

			const url = new URL(environment.MERCURE_URL);
			url.searchParams.append('topic', this.topicSubasta);

			const eventSource = new EventSource(url.toString());
			eventSource.onmessage = e => {
				this.load();
			};
		});
	}

    createForm(): void {
        this.busquedaForm = this._fb.group({
            cliente: [null],
            montoDesde: [null],
            montoHasta: [null],
            estatus: [null],
        });

		this.busquedaForm.valueChanges.subscribe(values => {
			this.load();
		});
	}

	load(): void {
		if (!this.sortedField) {
			this.sortedField = 'detalles.id';
			this.sortedType = 'DESC';
		}
		const req = this.busquedaForm.value;
		req.sortedField = this.sortedField;
		req.sortedType = this.sortedType;

		this.subastasDetallesService.getDetallesBySubasta(this.subastaId, req).subscribe(response => {
			this.detalles = response.body;
			console.log(this.detalles);
			this.chdr.detectChanges();
		},
		err => {
			console.log(err);
		});
	}

	invalidar(item: any): void {
		this.subastasDetallesService.invalidar(item.id).subscribe(response => {
			this.load();

		},
		err => {
			console.log(err);
		});
	}

	validar(item: any): void {
		this.subastasDetallesService.validar(item.id).subscribe(response => {
			this.load();
		},
		err => {
			console.log(err);
		});
	}



	 ganadoraFinal(item: any, params: any): void {
                this.subastasDetallesService.ganadoraFinal(item.id, params).subscribe(response => {
			this.load();
			this.toastService.success('Ganador Asignado Correctamente');

                },
                err => {
                        console.log(err);
                });
        }


 exportCsv(item:any, params:any) {
        this.subastasDetallesService.ganadoraPdf(item.id, params).subscribe(response => {
                this.detalle = response.body;
                let montoPuja = this.detalle.monto;
		let montoFinal = parseFloat(montoPuja);
		let final = montoFinal.toLocaleString("en-US", {style:"currency", currency:"USD"});
		const numerolote = this.detalle.subasta.lote.numero;
		const nombrelote = this.detalle.subasta.lote.nombre;
		let fechaPuja = parseDate(this.detalle.creado);
		const color = this.detalle.subasta.lote.color;
		const sexo = this.detalle.subasta.lote.sexo;
		const frchaNacimiento = parseDate(this.detalle.subasta.lote.fechaNacimiento);
		const numeroRegistro = this.detalle.subasta.lote.registro;
		const pesoNacer = this.detalle.subasta.lote.pesoNacer;
		const pesoDestete = this.detalle.subasta.lote.pesoDestete;
		let des = this.detalle.subasta.lote.informacionAnimal;                 
                console.log(this.detalle);
		console.log(typeof des);
		function parseDate (isodate) {
  		return (
    			new Date(isodate)
      			.toLocaleString('en-US', {
        		month: '2-digit',
        		day: '2-digit',
        		year: 'numeric'
      			})
      			.replace(/\//g, '-')
  			);
			}

			
         const data = {
                content: [
			{text: `VENTA PISO LOTE ${numerolote}, ${nombrelote}`, style: ['titulo']},
                        {text: `¡Felicidades, ha ganado el Lote ${numerolote}, ${nombrelote} por ${final} en nuestra Subasta!`, margin:[0,5,0,5]},
			{text: `Yo Sr(a):_____________________________________ he comprado al contado en venta pública al ser el mejor postor, el lote ${numerolote}, ${nombrelote} por la cantidad de ${final}, monto que debo y pagaré de manera inmediata en DigitalGanadera el dia ${fechaPuja} en sus instalaciones, de retrasarse el pago se aplicará un interés del 10% mensual hasta su liquidación total.`, style:['padding']},
			{text: `Firma Cliente:_____________________`, margin:[0,5,0,5]},
			{text:  `Datos del Lote`, margin:[0, 5, 0, 5]}, 
			{text: `No. Lote: ${numerolote}`},
			{text: `Nombre del Lote: ${nombrelote}`},
			{text: `Color: ${color}`},
			{text: `Sexo: ${sexo}`},
			{text: `Fecha de Nacimiento: ${frchaNacimiento}`},
			{text: `No. de Registro: ${numeroRegistro}`},
			{text: `Peso al Nacer: ${pesoNacer}`},
			{text: `Peso al Destete: ${pesoDestete}`},
			{text: `Descripción: ${des}`},
			{text: `Para mayor información, pagos en efectivo o transferencias favor de comunicarse con nuestro equipo por los siguientes medios:`, margin:[0,5,0,5]},
			{text: `Teléfonos: 6181132000`},
			{text: `Mail: venta@digitalganadera.com`},





                ],
                styles: {
                        titulo:{
                        alignment: 'center',
                        fontSize: 15,
			margin: 5
                },
			padding:{
			margin: [0 , 5 ,0 ,5],
			alignment: 'justify',
			}
                }

                }
                pdfMake.createPdf(data).download(`pujaFinal-lote_${numerolote}.pdf`);
		
        },
                err => {
                        console.log(err);
                });
}

    sorted(field: string): void {
        if (field !== this.sortedField) {
            this.sortedType = 'ASC';
        } else {
            if (this.sortedType === 'ASC') {
                this.sortedType = 'DESC';
            } else {
                this.sortedType = 'ASC';
            }
        }
        this.sortedField = field;
        this.load();
	}

}
