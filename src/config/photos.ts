// Every photo on the public site, with credit. All are free to use under the Unsplash License
// (https://unsplash.com/license). Credits are listed on /credits.
export type Photo = { src: string; alt: string; credit: string; href: string; position?: string };

const u = (id: string) => `https://images.unsplash.com/${id}`;

export const photos = {
  heroLearner: {
    src: u("photo-1786539468825-46c3b2b22f77"), position: "50% 35%",
    alt: "A smiling schoolboy in a green sweater",
    credit: "Mugabi Owen", href: "https://unsplash.com/photos/smiling-child-holding-white-box-hgw5SqtEIT8",
  },
  heroOnline: {
    src: u("photo-1765650114706-6f71e3cc904a"), position: "40% 40%",
    alt: "A young woman smiling as she works on a laptop",
    credit: "Fotografía Editorial", href: "https://unsplash.com/photos/woman-typing-on-laptop-at-workspace-RMK8Lt3Ac2s",
  },
  pupils: {
    src: u("photo-1617056239820-8ce90ba48193"), position: "50% 40%",
    alt: "Smiling primary school pupils in green and yellow uniforms",
    credit: "Abubakar Balogun", href: "https://unsplash.com/photos/boy-in-green-and-white-collared-shirt-OlJk99PX0Os",
  },
  student: {
    src: u("photo-1536337005238-94b997371b40"), position: "50% 35%",
    alt: "A smiling schoolboy at his desk in a classroom",
    credit: "Ben White", href: "https://unsplash.com/photos/boy-holding-white-paper-83tkHLPgg2Q",
  },
  teacher: {
    src: u("photo-1698827623362-f10eadf55a18"), position: "50% 40%",
    alt: "A teacher at the chalkboard in front of a class of young pupils",
    credit: "Elise Gaumier", href: "https://unsplash.com/photos/a-woman-teaching-a-class-of-children-in-a-classroom-NXGwIabbhSk",
  },
  parent: {
    src: u("photo-1735792339621-2846f164b78f"), position: "55% 40%",
    alt: "A mother in a blue headwrap smiling at her young son",
    credit: "Moses Sichach", href: "https://unsplash.com/photos/a-woman-sitting-next-to-a-child-on-a-bed-AdWkBmVCB9Q",
  },
  candidate: {
    src: u("photo-1541178735493-479c1a27ed24"), position: "60% 40%",
    alt: "A teenage student working on a laptop in a classroom",
    credit: "X", href: "https://unsplash.com/photos/man-in-grey-shirt-using-grey-laptop-computer-7d4LREDSPyQ",
  },
  school: {
    src: u("photo-1627423896085-e3e694d88e40"), position: "50% 40%",
    alt: "A full classroom of pupils raising their hands",
    credit: "Emmanuel Ikwuegbu", href: "https://unsplash.com/photos/children-in-white-tank-top-sitting-on-brown-wooden-bench-M-4lFg1Xfag",
  },
  nursery: {
    src: u("photo-1668620589356-56ba14193005"), position: "50% 35%",
    alt: "A young child resting on a stack of books at a desk",
    credit: "Joseph Agboola", href: "https://unsplash.com/photos/a-young-girl-sitting-at-a-desk-with-books-and-a-stack-of-books-S1W4_T4TnvY",
  },
  primary: {
    src: u("photo-1548102245-c79dbcfa9f92"), position: "50% 30%",
    alt: "Two smiling schoolboys in checked uniforms",
    credit: "TopSphere Media", href: "https://unsplash.com/photos/twin-boys-jLbmY5Zp7UQ",
  },
  junior: {
    src: u("photo-1567057420215-0afa9aa9253a"), position: "50% 40%",
    alt: "Pupils in green uniforms writing in their exercise books",
    credit: "Annie Spratt", href: "https://unsplash.com/photos/children-writing-in-books-feU8G7E5ODI",
  },
  senior: {
    src: u("photo-1728743264687-d96fbda27a88"), position: "45% 45%",
    alt: "Two students reading a textbook together at a classroom desk",
    credit: "Zach Wear", href: "https://unsplash.com/photos/a-couple-of-kids-that-are-sitting-in-a-desk-igyaKYzjkHU",
  },
  exam: {
    src: u("photo-1588674845784-9d0c32777b3a"), position: "40% 40%",
    alt: "A young man studying on a laptop at an outdoor table",
    credit: "Tobi Oshinnaike", href: "https://unsplash.com/photos/man-in-gray-crew-neck-t-shirt-using-macbook-pro-ajWHOi2r2uA",
  },
  lab: {
    src: u("photo-1528901166007-3784c7dd3653"), position: "60% 40%",
    alt: "A teacher helping a learner at a computer",
    credit: "X", href: "https://unsplash.com/photos/man-using-black-laptop-computer-kwzWjTnDPLk",
  },
  reading: {
    src: u("photo-1632215861513-130b66fe97f4"), position: "35% 40%",
    alt: "A student in a yellow uniform reading aloud to her class",
    credit: "Emmanuel Ikwuegbu", href: "https://unsplash.com/photos/a-woman-standing-in-front-of-a-group-of-children-VC6MGt9ZoBA",
  },
  joy: {
    src: u("photo-1547496613-4e19af6736dc"), position: "50% 40%",
    alt: "Laughing children crowding around the camera",
    credit: "bennett tobias", href: "https://unsplash.com/photos/boy-wearing-white-top-tqwOJAvUIh4",
  },
  smiling: {
    src: u("photo-1543689604-6fe8dbcd1f59"), position: "40% 45%",
    alt: "A boy smiling among his classmates",
    credit: "Annie Spratt", href: "https://unsplash.com/photos/boy-in-brown-collared-top-smiling-and-surrounded-by-children-QdK6aujOLYs",
  },
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;
