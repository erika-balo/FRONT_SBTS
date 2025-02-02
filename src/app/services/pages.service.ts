import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { createRequestOptionTotal } from 'app/shared/utils/request-utils';

import { environment } from 'app/../environments/environment';

@Injectable()
export class PagesService {

    private resourceUrl = environment.API_URL + '/pages';

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

    findOneCompletoBySlug(slug: string): Observable<any> {
        return this.http.get(this.resourceUrl + '/completo/by-slug/' + slug, { observe: 'response' });
    }

    save(params: any): Observable<any> {
        return this.http.post(this.resourceUrl, params, { observe: 'response' });
    }

    edit(id: number, params: any): Observable<any> {
        return this.http.put(this.resourceUrl + '/' + id, params, { observe: 'response' });
    }

}