/**
 * Photographs used on the site. All are from Unsplash under the Unsplash License (free to use, no
 * permission needed); photographers are credited on /credits anyway. Chosen to feel bright and proud:
 * children dressed for school, celebrating and learning with technology.
 */
export type Photo = { src: string; alt: string; by: string; page: string };

const u = (id: string) => `https://images.unsplash.com/${id}`;

export const photos = {
  heroBoy: { src: u("photo-1519238263530-99bdd11df2ea"), alt: "A smiling young boy in a smart navy cardigan and bow tie", by: "Terricks Noah", page: "https://unsplash.com/photos/n9R0MN3XGvY" },
  graduate: { src: u("photo-1628198661856-102874fb9d82"), alt: "A girl smiling in a green graduation gown and cap", by: "Oyemike Princewill", page: "https://unsplash.com/photos/4BvH27qTJ58" },
  uniformGirl: { src: u("photo-1660735148170-223b66e9f941"), alt: "A schoolgirl with braided hair smiling widely", by: "Fatima Yusuf", page: "https://unsplash.com/photos/fXT5DT3oC_0" },
  headphones: { src: u("photo-1732841700668-4eba867c9179"), alt: "A child wearing headphones, ready to listen to a lesson", by: "Michael Kora", page: "https://unsplash.com/photos/qBscbbuwH9s" },
  laptopGirl: { src: u("photo-1653566031285-8e198bca09d5"), alt: "A girl in glasses learning on a laptop", by: "UK Black Tech", page: "https://unsplash.com/photos/CPAcOKMZGiw" },
  laptopTeen: { src: u("photo-1661922029552-536b580ad96e"), alt: "A pupil in headphones working on a laptop", by: "BandLab", page: "https://unsplash.com/photos/9fHoFxcEevc" },
  schoolFriends: { src: u("photo-1548102249-acdce64fffbd"), alt: "Two smiling schoolboys in uniform with their school bags", by: "TopSphere Media", page: "https://unsplash.com/photos/oOHBxlGADx4" },
  classGroup: { src: u("photo-1612229693210-30e16029c415"), alt: "Pupils in white and blue uniforms posing happily on their school steps", by: "Heather Suggitt", page: "https://unsplash.com/photos/Jcg4Y4Zst0o" },
} satisfies Record<string, Photo>;
