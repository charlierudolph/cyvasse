import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from "@angular/router";
import { AuthenticationService } from "../services/authentication.service";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { doesHaveValue } from "../shared/utilities/value_checker";

@Injectable({
  providedIn: "root"
})
export class AuthGuard implements CanActivate {
  constructor(private readonly authenticationService: AuthenticationService) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authenticationService
      .getUserSubject()
      .pipe(map(x => doesHaveValue(x)));
  }
}
