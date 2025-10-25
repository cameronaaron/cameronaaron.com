'use client';

import { motion } from 'framer-motion';
import { profile } from '@/data/profile';
import { socialPlatforms } from '@/data/contact';
import SocialLink from '@/components/contact/SocialLink';

export default function Contact() {
  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Let's Work Together
          </h2>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            Have a project in mind? Let's discuss how we can work together to bring your ideas to life.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-12">
            {/* Email */}
            <motion.a
              href={`mailto:${profile.email}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group max-w-md w-full"
            >
              <div className="text-4xl mb-4 text-center">📧</div>
              <h3 className="text-xl font-bold text-white mb-2 text-center">Email</h3>
              <p className="text-purple-200 group-hover:text-white transition-colors text-center">
                {profile.email}
              </p>
            </motion.a>
          </div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Connect With Me</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {socialPlatforms.map((social, index) => (
                <SocialLink
                  key={index}
                  name={social.name}
                  icon={social.icon}
                  url={profile.social[social.key]}
                  color={social.color}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
