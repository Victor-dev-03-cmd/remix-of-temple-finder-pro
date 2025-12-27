import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { data: siteSettings } = useSiteSettings();

  const footerLinks = {
    explore: [
      { href: '/', label: 'Home' },
      { href: '/temples', label: 'Temples' },
      { href: '/categories', label: 'Categories' },
      { href: '/reviews', label: 'Reviews' },
    ],
    about: [
      { href: '/about', label: 'Our Story' },
      { href: '/contact', label: 'Contact' },
      { href: '/terms', label: 'Terms of Service' },
      { href: '/privacy', label: 'Privacy Policy' },
    ],
    vendor: [
      { href: '/become-vendor', label: 'Become a Vendor' },
      { href: '/vendor-faq', label: 'Vendor FAQ' },
      { href: '/support', label: 'Support Center' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: siteSettings?.socialFacebook || '#', label: 'Facebook' },
    { icon: Instagram, href: siteSettings?.socialInstagram || '#', label: 'Instagram' },
    { icon: Twitter, href: siteSettings?.socialTwitter || '#', label: 'Twitter' },
    { icon: Linkedin, href: siteSettings?.socialLinkedin || '#', label: 'LinkedIn' },
    { icon: Youtube, href: siteSettings?.socialYoutube || '#', label: 'YouTube' },
  ].filter(link => link.href);

  const renderLinkList = (links: { href: string; label: string }[]) => (
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            to={link.href}
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="container py-12 lg:py-16">
        {/* Mobile View - Accordion */}
        <div className="lg:hidden">
          <Accordion type="single" collapsible className="w-full">
            <div className="space-y-4 mb-8">
              <Link to="/" className="flex items-center gap-2">
                {siteSettings?.logoUrl ? (
                  <img
                    src={siteSettings.logoUrl}
                    alt={siteSettings.siteName}
                    className="h-8 w-auto max-w-[100px] object-contain"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <span className="text-sm font-bold text-primary-foreground">◇</span>
                  </div>
                )}
                <span className="text-lg font-semibold text-primary">{siteSettings?.siteName || 'Temple Connect'}</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                {siteSettings?.footerTagline || 'Connecting devotees with Hindu temples across Sri Lanka.'}
              </p>
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <social.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <AccordionItem value="explore">
              <AccordionTrigger className="font-semibold text-foreground">Explore</AccordionTrigger>
              <AccordionContent>{renderLinkList(footerLinks.explore)}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="about">
              <AccordionTrigger className="font-semibold text-foreground">About Us</AccordionTrigger>
              <AccordionContent>{renderLinkList(footerLinks.about)}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="vendor">
              <AccordionTrigger className="font-semibold text-foreground">Vendor & Support</AccordionTrigger>
              <AccordionContent>{renderLinkList(footerLinks.vendor)}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Desktop View - Grid */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              {siteSettings?.logoUrl ? (
                <img
                  src={siteSettings.logoUrl}
                  alt={siteSettings.siteName}
                  className="h-8 w-auto max-w-[100px] object-contain"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <span className="text-sm font-bold text-primary-foreground">◇</span>
                </div>
              )}
              <span className="text-lg font-semibold text-primary">{siteSettings?.siteName || 'Temple Connect'}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {siteSettings?.footerTagline || 'Connecting devotees with Hindu temples across Sri Lanka.'}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Explore</h3>
            {renderLinkList(footerLinks.explore)}
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-foreground">About Us</h3>
            {renderLinkList(footerLinks.about)}
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Vendor & Support</h3>
            {renderLinkList(footerLinks.vendor)}
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {siteSettings?.siteName || 'Temple Connect'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
