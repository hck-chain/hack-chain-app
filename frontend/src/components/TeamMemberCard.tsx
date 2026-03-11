import React from 'react';
import { Linkedin } from 'lucide-react';

interface TeamMemberCardProps {
  name: string;
  role: string;
  imageUrl: string;
  linkedinUrl?: string;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ name, role, imageUrl, linkedinUrl }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-50 to-slate-100 dark:from-blue-900/10 dark:to-slate-900/10 mb-4 shadow-lg transition-transform duration-300 hover:scale-[1.02] border border-white/10">
        <img
          src={imageUrl}
          alt={`Photo of ${name}`}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="w-full text-left mt-2 flex flex-col items-start gap-1">
        {linkedinUrl ? (
          <a
            href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
          >
            <h3 className="font-title text-xl font-bold text-foreground group-hover:text-blue-500 transition-colors">
              {name}
            </h3>
            <Linkedin className="w-5 h-5 text-blue-500 flex-shrink-0" />
          </a>
        ) : (
          <h3 className="font-title text-xl font-bold text-foreground">
            {name}
          </h3>
        )}
        <p className="font-body text-foreground/60">
          {role}
        </p>
      </div>
    </div>
  );
};
