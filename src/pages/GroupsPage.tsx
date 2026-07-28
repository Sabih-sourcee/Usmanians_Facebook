import React from "react";

export const GroupsPage: React.FC = () => {
  const groups = [
    {
      id: "g1",
      name: "Campus 12 Science Society",
      members: "142 members",
      category: "Academic",
      iconBg: "bg-surface-container text-primary",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.596 15.12a2 2 0 00-1.022.547l-1.8 1.8a2 2 0 00-.586 1.414V20a2 2 0 002 2h15.586a2 2 0 002-2v-1.118a2 2 0 00-.586-1.414l-1.8-1.8z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: "g2",
      name: "Physics Midterm Study Circle",
      members: "89 members",
      category: "Study Group",
      iconBg: "bg-secondary/10 text-secondary",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 14l9-5-9-5-9 5 9 5z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: "g3",
      name: "Inter-College Debate Squad",
      members: "56 members",
      category: "Extracurricular",
      iconBg: "bg-surface-container-high text-on-surface",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: "g4",
      name: "Usmanian Alumni Network",
      members: "310 members",
      category: "Alumni Hub",
      iconBg: "bg-primary/10 text-primary",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full gap-md">
      <div className="flex items-center justify-between gap-sm">
        <h2 className="text-headline-md text-on-surface">Student Groups</h2>
        <button
          type="button"
          className="inline-flex items-center gap-xs min-h-[44px] bg-primary text-on-primary px-md rounded-xl text-label-md font-semibold hover:bg-primary-container active:scale-[0.98] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Create
        </button>
      </div>

      <ul className="flex flex-col gap-sm list-none p-0 m-0">
        {groups.map((group) => (
          <li
            key={group.id}
            className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/20 flex items-center justify-between gap-md"
          >
            <div className="flex items-center gap-md min-w-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${group.iconBg} shrink-0`}>
                {group.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-body-md font-semibold text-on-surface truncate">{group.name}</span>
                <div className="flex items-center gap-xs flex-wrap">
                  <span className="text-label-sm text-on-surface-variant">{group.members}</span>
                  <span className="text-on-surface-variant" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-label-sm text-secondary">{group.category}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-pressed="true"
              className="min-h-[44px] bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-md rounded-lg text-label-md transition-colors shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              Joined
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
