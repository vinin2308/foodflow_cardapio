import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ItemCardapio } from '../models/item-cardapio.model';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})

export class PratoService {
  private apiUrl = environment.apiUrl + '/pratos/';

  constructor(private http: HttpClient) {}

  listarPratos(): Observable<ItemCardapio[]> {
    return this.http.get<ItemCardapio[]>(this.apiUrl);
  }
}
