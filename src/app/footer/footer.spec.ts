import { TestBed } from '@angular/core/testing';
import { Footer } from './footer';

describe('Footer', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
    }).compileComponents();
  });

  it('should create the footer component', () => {
    const fixture = TestBed.createComponent(Footer);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render brand, company details, and contact links', async () => {
    const fixture = TestBed.createComponent(Footer);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';

    expect(text).toContain('BLACKTOP & CO.');
    expect(text).toContain(
      'Curated Automotive Detailing Products, Car Care Accessories & Air Fresheners',
    );
    expect(text).toContain('FULL PLATFORM LAUNCHING SOON');
    expect(text).toContain('SHOP NOW');
    expect(text).toContain('TRADE & SUPPLIER ENQUIRIES');
    expect(text).toContain('STATUTORY COMPANY INFORMATION');
    expect(text).toContain('Company Registration Number (CRN): 17575573');
    expect(text).toContain('Registered Office: 124 City Road, London, EC1V 2NX');
    expect(text).toContain('© 2026 BlackTop & Co Ltd. All rights reserved.');

    const ebayLink = compiled.querySelector<HTMLAnchorElement>(
      'a[href="https://www.ebay.co.uk/usr/blacktopnco"]',
    );
    expect(ebayLink?.getAttribute('target')).toBe('_blank');
    expect(ebayLink?.getAttribute('rel')).toBe('noopener noreferrer');

    const emailLink = compiled.querySelector<HTMLAnchorElement>('a[href="mailto:trade@blacktopn.co"]');
    expect(emailLink?.textContent).toContain('trade@blacktopn.co');

    const websiteLink = compiled.querySelector<HTMLAnchorElement>(
      'a[href="https://www.blacktopn.co"]',
    );
    expect(websiteLink?.getAttribute('target')).toBe('_blank');
    expect(websiteLink?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
