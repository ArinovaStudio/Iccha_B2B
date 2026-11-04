export type AboutContent = {
  heroBadge: string; heroTitle: string; heroBody: string; heroImage: string; heroImageAlt: string;
  heroPrimaryLabel: string; heroPrimaryUrl: string; whatsappLabel: string; whatsappUrl: string;
  dispatchValue: string; dispatchLabel: string;
  storyTitle: string; storyBody: string; storyImage: string; storyImageAlt: string;
  categoriesTitle: string; categories: {label:string; image:string; alt:string}[];
  stats: {value:number; suffix:string; label:string}[];
  stepsTitle: string; steps: {title:string; body:string}[];
  reasonsTitle: string; reasons: {title:string; body:string}[];
  ctaTitle: string; ctaBody: string; ctaImage: string; ctaImageAlt: string; catalogEmail: string;
};
export type ContactContent = {
  directionsLabel: string;
  eyebrow: string; title: string; intro: string;
  showroomTitle: string; address: string; directionsUrl: string;
  phoneTitle: string; phone: string; whatsapp: string; whatsappLabel: string;
  hoursTitle: string; hours: string; closed: string;
  faqTitle: string; faqs: {question:string; answer:string}[];
  formTitle: string; formIntro: string; submitLabel: string; formNote: string;
};
export type HomeFeaturesContent = { title: string; cards: { icon: string; title: string; body: string }[] };


