import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { createRequestOptionTotal } from 'app/shared/utils/request-utils';

import { environment } from 'app/../environments/environment';

@Injectable()
export class SlidersService {

    private resourceUrl = environment.API_URL + '/sliders';

    constructor(
        private http: HttpClient
    ) {
    }

    findAll(): Observable<any> {
        return this.http.get(this.resourceUrl, { observe: 'response' });
	}

    findOneCompleto(id: number): Observable<any> {
        return this.http.get(this.resourceUrl + '/completo/' + id, { observe: 'response' });
    }

    save(params: any): Observable<any> {
        return this.http.post(this.resourceUrl, params, { observe: 'response' });
    }

    edit(id: number, params: any): Observable<any> {
        return this.http.put(this.resourceUrl + '/' + id, params, { observe: 'response' });
	}

    borrar(id: number): Observable<any> {
        return this.http.delete(this.resourceUrl + '/' + id, { observe: 'response' });
    }

}