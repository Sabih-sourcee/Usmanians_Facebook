import React from "react";
import { UserProfile } from "../data/mockUser";

interface ProfileHeaderProps {
  user: UserProfile;
  onEditProfile?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, onEditProfile }) => {
  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full">
        <div className="w-full h-40 sm:h-48 rounded-xl overflow-hidden bg-surface-container border border-outline-variant">
          <img src={user.coverImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
        </div>
        <div className="absolute -bottom-10 left-md">
          <div className="p-1 bg-surface-container-lowest rounded-full border border-outline-variant shadow-sm">
            <img
              alt={`${user.name} profile photo`}
              className="w-24 h-24 rounded-full object-cover"
              width={96}
              height={96}
              src={user.avatar}
            />
          </div>
        </div>
      </div>

      <div className="mt-14 px-xs">
        <div className="flex justify-between items-start gap-md">
          <div className="flex flex-col gap-sm min-w-0">
            <h2 className="text-headline-lg text-on-surface truncate">{user.name}</h2>
            {/* Solid class badge — text-safe gold + icon (never colour alone) */}
            <div className="inline-flex items-center gap-xs bg-secondary-container px-sm py-xs rounded-lg max-w-full self-start">
              <svg className="w-4 h-4 text-on-secondary-container shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-label-sm text-on-secondary-container font-semibold tracking-wide truncate">
                {user.badgeText}
              </span>
            </div>
            <div className="inline-flex items-center gap-xs text-secondary self-start">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-label-sm font-semibold">Verified Usmanian</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onEditProfile}
            className="bg-primary text-on-primary px-lg min-h-[44px] rounded-xl text-label-md font-semibold transition-colors duration-150 active:scale-[0.98] hover:bg-primary-container shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Edit profile
          </button>
        </div>
        <p className="mt-md text-body-md text-on-surface-variant leading-relaxed line-clamp-3">
          {user.bio}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-md mt-lg py-md px-sm bg-surface-container-lowest rounded-xl border border-outline-variant">
        <div className="flex flex-col items-center">
          <span className="text-headline-md text-primary">{user.stats.posts}</span>
          <span className="text-label-sm text-on-surface-variant">Posts</span>
        </div>
        <div className="flex flex-col items-center border-x border-outline-variant">
          <span className="text-headline-md text-primary">{user.stats.followers}</span>
          <span className="text-label-sm text-on-surface-variant">Followers</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-headline-md text-primary">{user.stats.notes}</span>
          <span className="text-label-sm text-on-surface-variant">Notes</span>
        </div>
      </div>
    </div>
  );
};
