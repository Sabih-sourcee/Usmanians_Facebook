export interface PostAttachment {
  fileName: string;
  fileSize: string;
  categories?: string[];
  imageUrl?: string;
  downloadUrl?: string;
}

export interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    timestamp: string;
  };
  content: string;
  categoryHeader?: string;
  type?: "standard" | "notes" | "academic" | "thought";
  attachment?: PostAttachment;
  tags?: string[];
  likes: number;
  comments: number;
  liked?: boolean;
}

export const feedPosts: Post[] = [
  {
    id: "feed-1",
    type: "standard",
    author: {
      name: "Zaid Ahmed",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0GCpo-OR59W06mr3a9U8noUKSD4ZQc_R2SbYmp3GCM6zkRcfyes2lsmry47SDymNnXe93R43inWhPiDHbEWNFA3-9yV1V3Ea39GwhquEiu7eP2CqYwGv_j-MCTY_uW9QXGCoalSP-wljz2RQ0lCvBEt5kr3bNvr2iSChUvm_LseV03_tjXVu26t2kQ1BF3Ml3X7CeUJYCAS33e-l_srij-x7tHQVKovpojlk1UqBVZZyyAafEiD8",
      timestamp: "2 hours ago",
    },
    content: "Just finished the annual inter-college debate! So proud of our team for securing the second runner-up position. The atmosphere at the auditorium was absolutely electric today. 🏆",
    likes: 124,
    comments: 18,
    liked: false
  },
  {
    id: "feed-2",
    type: "notes",
    author: {
      name: "Sara Khan",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTse09zDXwOADYsRVOoiAfFqKuatFgq_saCUi3dkDuggWEeeQeUqo2ElWyaISHeW_Tes4JKmZKeCSIBemH1jQ9U4DeNV95hAmf71fhxlJEVBXRrIf5aAPPi6uexaf6Z4I7rsLdIOF-k_1NDiMDPWK8rSX7JMbPlajBUvQXRMVu2C9fBpkb-EBqGnmmJLY-SrcAlXDcUSD-_GYaqxB0tUGJ6FH0tfGcBAxWeboVDSihU6koinLNqqw",
      timestamp: "4 hours ago",
    },
    content: "Uploaded the final review notes for the Physics midterms. Hope this helps everyone! Good luck studying! 📚",
    attachment: {
      fileName: "Physics_Notes_Final.pdf",
      fileSize: "2.4 MB • PDF Document",
      categories: ["Science", "Physics"]
    },
    likes: 89,
    comments: 42,
    liked: false
  }
];

export const profilePosts: Post[] = [
  {
    id: "profile-1",
    type: "academic",
    categoryHeader: "Academic Achievement",
    author: {
      name: "Usmanian",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXAbbFpzRozdzNhnp6Q-4R4sd5YFb4o7Bue4GX_LkascExPoRIx61jvX4l3sWQARY77kjmrwJ302CXZdkHJXqiKLOugjBlDPlc7dSMb1gbmzt9_orhpK4JgGk7wMlVezZYSmculsq6QbMqRFhziOSJLsU3UZzdH5JD0a7iPPxfmgDsJ9znfu0s9QdEfIGlA9i94PnmnPsNZlynKmKNNtxkGjVMpa6Uh5S7S3vJPmoHD7BrzGDlTuk",
      timestamp: "2 hours ago",
    },
    content: "Excited to announce that our team won the Inter-Campus Science Fair! Grateful for the mentorship from the faculty at Campus 12. 🧬✨",
    attachment: {
      fileName: "Science_Fair_Team.jpg",
      fileSize: "High Res Photo",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzCyTPaEU1T8WOnK3BuKG27p5RYLsh-aHmfD8HWTcgZzkJqaEcEreCxHOtQgggLk0w9BOeidJ7sCUBXqVwG3008mnqD1KKkR3iHFe6jLWqdlEJxgxrtCQvNGOcOInqGiZ8li-faz0d8upAKAWDEGkmyFinCFVFAtx-FHJGfl713MuFxuZdHnmMWHUQKfy2T2XUVbW0O9FmC7bRSB8ffuEtTU2AaL1av-2WUJni1rxCoLJ064pbSIo"
    },
    likes: 48,
    comments: 12,
    liked: false
  },
  {
    id: "profile-2",
    type: "thought",
    categoryHeader: "Thought of the day",
    author: {
      name: "Usmanian",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXAbbFpzRozdzNhnp6Q-4R4sd5YFb4o7Bue4GX_LkascExPoRIx61jvX4l3sWQARY77kjmrwJ302CXZdkHJXqiKLOugjBlDPlc7dSMb1gbmzt9_orhpK4JgGk7wMlVezZYSmculsq6QbMqRFhziOSJLsU3UZzdH5JD0a7iPPxfmgDsJ9znfu0s9QdEfIGlA9i94PnmnPsNZlynKmKNNtxkGjVMpa6Uh5S7S3vJPmoHD7BrzGDlTuk",
      timestamp: "Yesterday",
    },
    content: "Reading \"The Alchemist\" for the second time. It's fascinating how a book can mean something entirely different depending on where you are in your life.",
    tags: ["#Literature", "#GrowthMindset"],
    likes: 24,
    comments: 5,
    liked: false
  }
];

export const profileNotes: Post[] = [
  {
    id: "profile-note-1",
    type: "notes",
    categoryHeader: "Shared Note",
    author: {
      name: "Usmanian",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXAbbFpzRozdzNhnp6Q-4R4sd5YFb4o7Bue4GX_LkascExPoRIx61jvX4l3sWQARY77kjmrwJ302CXZdkHJXqiKLOugjBlDPlc7dSMb1gbmzt9_orhpK4JgGk7wMlVezZYSmculsq6QbMqRFhziOSJLsU3UZzdH5JD0a7iPPxfmgDsJ9znfu0s9QdEfIGlA9i94PnmnPsNZlynKmKNNtxkGjVMpa6Uh5S7S3vJPmoHD7BrzGDlTuk",
      timestamp: "3 days ago",
    },
    content: "Summarized the key points for Electromagnetism. Hope this helps everyone for the upcoming midterms!",
    attachment: {
      fileName: "Physics_Unit_4_Revision.pdf",
      fileSize: "2.4 MB • Grade 9",
    },
    likes: 31,
    comments: 8,
    liked: false
  }
];
