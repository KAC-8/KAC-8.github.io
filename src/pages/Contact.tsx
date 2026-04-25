import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, MessageCircle, Github, Youtube, Instagram, Twitter, Music2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

const Contact = () => {
  const { t, isRTL } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const socialLinks = [
    { icon: Mail, label: 'Email', href: 'mailto:ka0530959@gmail.com', color: 'hover:text-red-500' },
    { icon: MessageCircle, label: 'Discord', href: 'https://discord.gg/vuBfJJKzVF', color: 'hover:text-indigo-500' },
    { icon: Github, label: 'GitHub', href: 'https://github.com/KAC-8', color: 'hover:text-foreground' },
    { icon: Youtube, label: 'YouTube', href: 'https://www.youtube.com/@KAC8-YT', color: 'hover:text-red-600' },
    { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/kacx_8/', color: 'hover:text-pink-500' },
    { icon: Twitter, label: 'X (Twitter)', href: 'https://x.com/kac8_8', color: 'hover:text-foreground' },
    { icon: Music2, label: 'TikTok', href: 'https://www.tiktok.com/@k.70.x', color: 'hover:text-foreground' },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: isRTL ? 'تم إرسال الرسالة!' : 'Message Sent!',
      description: isRTL
        ? 'شكراً لتواصلك. سأرد عليك قريباً.'
        : 'Thank you for reaching out. I\'ll get back to you soon.',
    });

    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold">{t('contact.title')}</h1>
          <p className="text-xl text-primary">{t('contact.subtitle')}</p>
          <p className="text-muted-foreground max-w-xl mx-auto">{t('contact.description')}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  {t('contact.name')}
                </label>
                <Input
                  id="name"
                  name="name"
                  required
                  className="rounded-xl bg-background/50"
                  placeholder={isRTL ? 'أدخل اسمك' : 'Enter your name'}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {t('contact.email')}
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="rounded-xl bg-background/50"
                  placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  {t('contact.message')}
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="rounded-xl bg-background/50 resize-none"
                  placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full rounded-xl forest-gradient glow-box"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  />
                ) : (
                  <>
                    <Send className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('contact.send')}
                  </>
                )}
              </Button>
            </form>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            <div className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">{t('contact.connect')}</h2>
              <div className="grid grid-cols-2 gap-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all ${social.color}`}
                  >
                    <social.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{social.label}</span>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Quick Email */}
            <motion.a
              href="mailto:ka0530959@gmail.com"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              className="block glass rounded-2xl p-8 text-center group"
            >
              <Mail className="w-12 h-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <p className="text-lg font-medium mb-1">
                {isRTL ? 'أو راسلني مباشرة' : 'Or email me directly'}
              </p>
              <p className="text-primary font-mono">ka0530959@gmail.com</p>
            </motion.a>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
