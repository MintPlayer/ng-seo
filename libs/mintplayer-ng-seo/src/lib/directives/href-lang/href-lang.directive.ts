import { APP_BASE_HREF, DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Directive, Inject, Input, OnDestroy, Optional, Renderer2 } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { ROUTER, IRouter } from '@mintplayer/ng-router-provider';
import { BehaviorSubject, Observable, Subject, combineLatest, map, takeUntil } from 'rxjs';
import { CommandsAndExtras } from '../../interfaces/commands-and-extras';

@Directive({
  selector: '[hrefLang]'
})
export class HrefLangDirective implements OnDestroy {

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) document: any,
    router: Router,
    @Optional() @Inject(ROUTER) advancedRouter?: IRouter,
    @Optional() @Inject(APP_BASE_HREF) private baseUrl?: string) {
    this.document = <Document>document;
    this.router = advancedRouter || router;

    this.hreflang$ = combineLatest([this.language$, this.commands$, this.extras$])
      .pipe(map(([language, commands, extras]) => {
        if (language) {
          return { [language]: <CommandsAndExtras>{ commands, extras } };
        } else {
          return null;
        }
      }));
      


    combineLatest([this.language$, this.commands$, this.extras$])
      .pipe(takeUntil(this.destroyed$))
      .subscribe(([language, commands, extras]) => {
        this.dispose();
        // Object.entries(hreflang).forEach(([propKey, propValue]) => {
          const link = <HTMLLinkElement>this.renderer.createElement('link');
          link.rel = 'alternate';
          link.hreflang = language!;

          const tree = this.router.createUrlTree(commands, extras ?? undefined);
          if (this.baseUrl) {
            link.href = this.baseUrl + this.router.serializeUrl(tree);
          } else {
            link.href = this.router.serializeUrl(tree);
          }

          this.renderer.appendChild(this.document.head, link);
          this.tags.push(link);
        // });
      });
  }

  private document: Document;
  private router: Router | IRouter;
  private tags: HTMLLinkElement[] = [];

  // private hreflang$ = new BehaviorSubject<Record<string, CommandsAndExtras>>({});
  private language$ = new BehaviorSubject<string | null>(null);
  private commands$ = new BehaviorSubject<any[]>([]);
  private extras$ = new BehaviorSubject<NavigationExtras | null>(null);
  private hreflang$: Observable<Record<string, CommandsAndExtras> | null>;
  private destroyed$ = new Subject();

  // @Input() set hrefLang(value: Record<string, CommandsAndExtras>) {
  //   this.hreflang$.next(value);
  // }
  @Input() set hrefLang(value: string) {
    this.language$.next(value);
  }
  @Input() set commands(value: any[]) {
    this.commands$.next(value);
  }
  @Input() set extras(value: NavigationExtras) {
    this.extras$.next(value);
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.dispose();
  }

  private dispose() {
    this.tags.forEach((tag) => {
      tag.remove();
    });
  }
}
