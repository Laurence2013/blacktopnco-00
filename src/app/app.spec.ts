import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the under construction landing page and eBay link', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('We are under construction');
    expect(compiled.querySelector('.description')?.textContent).toContain(
      'Please go to our eBay page to see our products',
    );

    const link = compiled.querySelector<HTMLAnchorElement>('a.cta-link');
    expect(link?.getAttribute('href')).toBe('https://www.ebay.co.uk/usr/blacktopnco');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');

    const card = compiled.querySelector('section.card');
    expect(card?.textContent).toContain('SHOP NOW');
    expect(card?.textContent).toContain(
      'While our full web storefront is in development, browse and order our current range directly through our official eBay Business store:',
    );
    const shopLink = card?.querySelector<HTMLAnchorElement>('a.inline-link');
    expect(shopLink?.getAttribute('href')).toBe('https://www.ebay.co.uk/usr/blacktopnco');
    expect(shopLink?.getAttribute('target')).toBe('_blank');
    expect(shopLink?.getAttribute('rel')).toBe('noopener noreferrer');

    expect(compiled.querySelector('app-footer')).toBeTruthy();
  });
});
