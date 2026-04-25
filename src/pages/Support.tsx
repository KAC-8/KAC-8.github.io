import { motion } from 'framer-motion';
import { Heart, Coffee, Sparkles, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const Support = () => {
  const { t, isRTL } = useLanguage();

  const supportOptions = [
    {
      icon: Heart,
      title: 'Patreon',
      description: isRTL
        ? 'انضم إلى مجتمعي واحصل على محتوى حصري ووصول مبكر للمشاريع.'
        : 'Join my community and get exclusive content and early access to projects.',
      link: 'https://www.patreon.com/c/kac8',
      buttonText: t('support.patreon'),
      color: 'bg-[#FF424D]',
    },
    {
      icon: Coffee,
      title: 'PayPal',
      description: isRTL
        ? 'ادعمني بتبرع لمرة واحدة للمساعدة في تمويل المشاريع القادمة.'
        : 'Support me with a one-time donation to help fund upcoming projects.',
      link: 'https://paypal.me/Khald982',
      buttonText: t('support.paypal'),
      color: 'bg-[#0070BA]',
    },
  ];

  const benefits = isRTL
    ? [
        'وصول مبكر للمشاريع الجديدة',
        'دروس ومحتوى حصري',
        'قناة Discord خاصة',
        'ذكر اسمك في المشاريع',
      ]
    : [
        'Early access to new projects',
        'Exclusive tutorials & content',
        'Private Discord channel',
        'Name in project credits',
      ];

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block"
          >
            <Heart className="w-16 h-16 text-primary mx-auto mb-4" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold">{t('support.title')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('support.subtitle')}
          </p>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('support.description')}
          </p>
        </motion.div>

        {/* Support Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {supportOptions.map((option, index) => (
            <motion.div
              key={option.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ y: -5 }}
              className="glass rounded-2xl p-8 space-y-6"
            >
              <div className={`inline-flex p-4 rounded-2xl ${option.color}/20`}>
                <option.icon className={`w-8 h-8`} style={{ color: option.color.replace('bg-[', '').replace(']', '') }} />
              </div>
              <h2 className="text-2xl font-bold">{option.title}</h2>
              <p className="text-muted-foreground">{option.description}</p>
              <Button
                asChild
                size="lg"
                className={`w-full rounded-xl ${option.color} hover:opacity-90 transition-opacity`}
              >
                <a href={option.link} target="_blank" rel="noopener noreferrer">
                  {option.buttonText}
                </a>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-8 text-center"
        >
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('support.thanks')}</h2>
          <p className="text-muted-foreground mb-8">{t('support.thanks.text')}</p>
          
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-primary/5"
              >
                <Star className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-start">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Support;
