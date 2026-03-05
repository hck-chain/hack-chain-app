import React from 'react';
import {
  FaLinkedin,
  FaInstagram,
  FaTelegram,
  FaTiktok,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const socials = [
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/company/hack-chain',
    icon: <FaLinkedin className="w-6 h-6 text-[#0A66C2]" />,
  },
  {
    name: 'X',
    href: 'https://x.com/hackchain_',
    icon: <FaXTwitter className="w-6 h-6 text-white" />,
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/hack_chain',
    icon: <FaInstagram className="w-6 h-6 text-[#E4405F]" />,
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com/@hack.chain',
    icon: <FaTiktok className="w-6 h-6 text-white" />,
  },
  {
    name: 'Telegram',
    href: 'https://t.me/+cEcZh7zauR4zN2Ix',
    icon: <FaTelegram className="w-6 h-6 text-[#26A5E4]" />,
  },
];


const Footer: React.FC = () => (
  <footer className="py-14 glass border-t border-white/10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

      {/* Brand */}
      <div className="mb-3 flex justify-center">
        <img
          src="/images/logoHackchain2.png"
          alt="HackChain logo"
          className="h-24 md:h-28 w-auto object-contain"
        />
      </div>


      {/* Socials */}
      <div className="flex justify-center gap-6 mt-8">
        {socials.map((social) => (
          <a
            key={social.name}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.name}
            className="
              inline-flex items-center justify-center
              w-11 h-11 rounded-full
              bg-white/10
              transition-all duration-300
              hover:bg-white/20 hover:scale-110
            "
          >
            {social.icon}
          </a>
        ))}
      </div>

      {/* Legal */}
      <div className="mt-8 font-body text-sm text-muted-foreground">
        © 2025 HackChain. Non-Fungible Talent.
      </div>

    </div>
  </footer>
);

export default Footer;
