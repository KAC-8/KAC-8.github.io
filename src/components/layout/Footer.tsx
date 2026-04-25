import { motion } from 'framer-motion';
import { Github, Youtube, MessageCircle, Music2, Instagram, Twitter, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: MessageCircle, href: 'https://discord.gg/vuBfJJKzVF', label: 'Discord' },
    { icon: Youtube, href: 'https://www.youtube.com/@KAC8-YT', label: 'YouTube' },
    { icon: Github, href: 'https://github.com/KAC-8', label: 'GitHub' },
    { icon: Music2, href: 'https://www.tiktok.com/@k.70.x', label: 'TikTok' },
    { icon: Instagram, href: 'https://www.instagram.com/kacx_8/', label: 'Instagram' },
    { icon: Twitter, href: 'https://x.com/kac8_8', label: 'X (Twitter)' },
    { icon: Mail, href: 'mailto:ka0530959@gmail.com', label: 'Email' },
  ];

  return (
    <footer className="relative mt-20 py-12 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col items-center gap-8">
          {/* Logo */}
          <motion.span
            className="text-3xl font-bold font-mono text-primary glow-text"
            whileHover={{ scale: 1.05 }}
          >
            &lt;KAC8/&gt;
          </motion.span>

          {/* Social Links */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-xl glass hover:bg-primary/10 transition-colors duration-300 group"
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.a>
            ))}
          </div>

          {/* Bottom Text */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              © {currentYear}  {t('footer.rights')}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {t('footer.built')} 🇸🇦
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
