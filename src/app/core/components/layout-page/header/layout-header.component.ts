import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

import { Store, select } from '@ngrx/store';
import { AppState, currentUser, Logout } from 'app/store';

import { Subject } from 'rxjs';
import { delay, filter, take, takeUntil } from 'rxjs/operators'

@Component({
  selector: 'app-layout-header',
  templateUrl: './layout-header.component.html',
  styleUrls: ['./layout-header.component.css']
})
export class LayoutHeaderComponent implements OnInit, OnDestroy {

  @Input() navClass: string;

  isAdmin: boolean;
  isSubasta: boolean;
  isUser: boolean;

  private _unsubscribeAll: Subject<any>;

  constructor(
    private router: Router,
    private store: Store<AppState>,
    ) {
    router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {
        this._activateMenuDropdown();
      }
    });
  }
  isCondensed = false;

  ngAfterViewInit() {
    this._activateMenuDropdown();
  }

  ngOnInit(): void {
    this._unsubscribeAll = new Subject();

    this.store.pipe(
        takeUntil(this._unsubscribeAll),
        select(currentUser),
        filter(user => user)
    ).subscribe(user => {
        this.isAdmin = user.roles.indexOf('ROLE_ADMIN') >= 0;
        this.isSubasta = user.roles.indexOf('ROLE_SUBASTA') >= 0;
        this.isUser = user.roles.indexOf('ROLE_USER') >= 0;
    });
  }

  _activateMenuDropdown() {
    /**
     * Menu activation reset
     */
    const resetParent = (el) => {
      el.classList.remove('active');
      const parent = el.parentElement;

      /**
       * TODO: This is hard coded way of expading/activating parent menu dropdown and working till level 3.
       * We should come up with non hard coded approach
       */
      if (parent) {
        parent.classList.remove('active');
        const parent2 = parent.parentElement;
        if (parent2) {
          parent2.classList.remove('active');
          const parent3 = parent2.parentElement;
          if (parent3) {
            parent3.classList.remove('active');
            const parent4 = parent3.parentElement;
            if (parent4) {
              const parent5 = parent4.parentElement;
              parent5.classList.remove('active');
            }
          }
        }
      }
    };
    let links = document.getElementsByClassName('nav-link-ref');
    let matchingMenuItem = null;
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < links.length; i++) {
      // reset menu
      resetParent(links[i]);
    }
    for (let i = 0; i < links.length; i++) {
      if (window.location.pathname === links[i]['pathname']) {
        matchingMenuItem = links[i];
        break;
      }
    }

    if (matchingMenuItem) {
      matchingMenuItem.classList.add('active');
      const parent = matchingMenuItem.parentElement;

      /**
       * TODO: This is hard coded way of expading/activating parent menu dropdown and working till level 3.
       * We should come up with non hard coded approach
       */
      if (parent) {
        parent.classList.add('active');
        const parent2 = parent.parentElement;
        if (parent2) {
          parent2.classList.add('active');
          const parent3 = parent2.parentElement;
          if (parent3) {
            parent3.classList.add('active');
            const parent4 = parent3.parentElement;
            if (parent4) {
              const parent5 = parent4.parentElement;
              parent5.classList.add('active');
            }
          }
        }
      }
    }
  }

  /**
   * Window scroll method
   */
  // tslint:disable-next-line: typedef
  windowScroll() {
    if (
      document.body.scrollTop > 50 ||
      document.documentElement.scrollTop > 50
    ) {
      document.getElementById('topnav').classList.add('nav-sticky');
    } else {
      document.getElementById('topnav').classList.remove('nav-sticky');
    }
    if (document.getElementById('back-to-top')) {
      if (document.body.scrollTop > 100 ||
        document.documentElement.scrollTop > 100) {
        document.getElementById('back-to-top').style.display = 'inline';
      } else {
        document.getElementById('back-to-top').style.display = 'none';
      }
    }
  }
  /**
   * Toggle menu
   */
  toggleMenu() {
    this.isCondensed = !this.isCondensed;
    if (this.isCondensed) {
      document.getElementById('navigation').style.display = 'block';
    } else {
      document.getElementById('navigation').style.display = 'none';
    }
  }

  /**
   * Menu clicked show the submenu
   */
  onMenuClick(event) {
    event.preventDefault();
    const nextEl = event.target.nextSibling.nextSibling;
    if (nextEl && !nextEl.classList.contains('open')) {
      const parentEl = event.target.parentNode;
      if (parentEl) {
        parentEl.classList.remove('open');
      }
      nextEl.classList.add('open');
    } else if (nextEl) {
      nextEl.classList.remove('open');
    }
    return false;
  };

    cerrarSesion(): void {
        this.store.dispatch(new Logout());
        this.router.navigate(['/']);
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
}
