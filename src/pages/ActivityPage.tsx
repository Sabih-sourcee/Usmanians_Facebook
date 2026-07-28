import React from "react";

export const ActivityPage: React.FC = () => {
  const activities = [
    {
      id: "a1",
      title: "Science Fair Announcement",
      description: "Campus 12 team won 1st position in Inter-Campus Science Fair.",
      time: "2 hours ago",
      type: "announcement",
      read: false,
    },
    {
      id: "a2",
      title: "New Physics Notes Uploaded",
      description: "Sara Khan shared Physics_Notes_Final.pdf with Grade 9.",
      time: "4 hours ago",
      type: "notes",
      read: false,
    },
    {
      id: "a3",
      title: "Principal Voting Started",
      description: "The 2026-2027 Academic Principal poll is now open for students.",
      time: "1 day ago",
      type: "poll",
      read: true,
    },
    {
      id: "a4",
      title: "Group Invitation",
      description: "Zaid Ahmed invited you to join Inter-College Debate Squad.",
      time: "2 days ago",
      type: "group",
      read: true,
    },
  ] as const;

  const iconFor = (type: (typeof activities)[number]["type"]) => {
    switch (type) {
      case "notes":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case "poll":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case "group":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
    }
  };

  return (
    <div className="flex flex-col w-full gap-md">
      <div className="flex items-center justify-between gap-sm">
        <h2 className="text-headline-md text-on-surface">Recent Activity</h2>
        <span className="inline-flex items-center gap-xs text-label-sm text-primary bg-primary-fixed px-sm py-xs rounded-lg font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
          2 unread
        </span>
      </div>

      <ul className="flex flex-col gap-sm list-none p-0 m-0">
        {activities.map((item) => (
          <li
            key={item.id}
            className={`bg-surface-container-lowest rounded-xl p-md border flex items-start gap-md ${
              item.read ? "border-outline-variant" : "border-l-4 border-l-primary border-outline-variant"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
              {iconFor(item.type)}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-start justify-between gap-sm">
                <span className="text-body-md font-semibold text-on-surface">
                  {item.title}
                  {!item.read && <span className="sr-only"> (unread)</span>}
                </span>
                <time className="text-label-sm text-on-surface-variant shrink-0">{item.time}</time>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-xs">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
