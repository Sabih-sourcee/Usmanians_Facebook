export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  coverImage: string;
  badgeText: string;
  bio: string;
  stats: {
    posts: number;
    followers: number;
    notes: number;
  };
}

export const mockUser: UserProfile = {
  id: "user_001",
  name: "Usmanian",
  email: "name@alumni.edu",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXAbbFpzRozdzNhnp6Q-4R4sd5YFb4o7Bue4GX_LkascExPoRIx61jvX4l3sWQARY77kjmrwJ302CXZdkHJXqiKLOugjBlDPlc7dSMb1gbmzt9_orhpK4JgGk7wMlVezZYSmculsq6QbMqRFhziOSJLsU3UZzdH5JD0a7iPPxfmgDsJ9znfu0s9QdEfIGlA9i94PnmnPsNZlynKmKNNtxkGjVMpa6Uh5S7S3vJPmoHD7BrzGDlTuk",
  coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuB1PHMyHhKg5ZrrvJF5EWLBqOq1Xr14RYZ_fvONpxDnRB1OIbA_KT8ESUhrtFKW1Q5D2jyPeZmxFqSkzLxTLwdl_W3Ie32YQtL6P0BvirJKwLXSsFozHzIEvnlzW8gPpuUea5FqKyIGcX1LCZcNGgabm7GAFhvCP68Rur2MDHsfUaEEa3DPDdU0_qP6EWmeR7uH6jfLdgmSyYNZl5WAcbogW4QUDKf42MjrDveMChcw2Lu0tM1s2ow",
  badgeText: "GRADE 9 • CAMPUS 12",
  bio: "Aspiring software engineer and student leader. Currently exploring the intersections of sustainable architecture and community building.",
  stats: {
    posts: 124,
    followers: 850,
    notes: 42
  }
};
