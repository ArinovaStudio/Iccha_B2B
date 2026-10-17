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

export const defaultAbout: AboutContent = {
  heroBadge:"Trusted by 800+ retailers across 14 states", heroTitle:"Every shopkeeper’s wish list starts on our shelves.", heroBody:"We supply retailers with ready stock, fair minimums, and fast turnaround — so your shop never has to explain an empty rack to a customer.", heroImage:"https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600", heroImageAlt:"Wholesale garment stock ready for dispatch", heroPrimaryLabel:"Get the current catalog", heroPrimaryUrl:"#contact", whatsappLabel:"Chat on WhatsApp", whatsappUrl:"https://wa.me/919147414203", dispatchValue:"48h", dispatchLabel:"average dispatch",
  storyTitle:"A counter that grew into a floor.", storyBody:"Iccha Store began as a single counter in the wholesale market, stocking a handful of lines for a handful of shopkeepers. Word travelled the way it does in this trade — through the people who reorder. Today the same floor holds hundreds of styles across menswear, womenswear, and kidswear, and the same rule still applies: quote it straight, pack it right, and never make a retailer wait on their own stock.", storyImage:"https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600", storyImageAlt:"Iccha Store wholesale floor", categoriesTitle:"What’s on the floor.", categories:[{label:"Menswear",image:"https://picsum.photos/id/1005/600/750",alt:"Menswear"},{label:"Womenswear",image:"https://picsum.photos/id/1027/600/750",alt:"Womenswear"},{label:"Kidswear",image:"https://picsum.photos/id/1011/600/750",alt:"Kidswear"},{label:"Ethnic wear",image:"https://picsum.photos/id/1025/600/750",alt:"Ethnic wear"}],
  stats:[{value:800,suffix:"+",label:"retailers supplied"},{value:1200,suffix:"+",label:"styles in catalog"},{value:14,suffix:"",label:"states shipped to"},{value:48,suffix:"h",label:"average dispatch time"}], stepsTitle:"How an order moves through the floor.",steps:[{title:"Share your requirement",body:"Call, WhatsApp, or walk into the showroom with your size run and style list."},{title:"We pull your stock",body:"Straight from live inventory — no waiting on lines that are out of stock."},{title:"Check and pack",body:"Every piece is checked for size and stitching before it leaves the floor."},{title:"Dispatch to your store",body:"Packed by carton, billed by GST invoice, sent on the transport you choose."}], reasonsTitle:"Why retailers keep coming back.", reasons:[{title:"No minimum surprises",body:"MOQ is fixed per style upfront, so your order total is never a guess at the counter."},{title:"Fresh stock, every week",body:"New lots land weekly across sarees, kurtis, casual wear, and kidswear."},{title:"Billing you can reconcile",body:"Clean GST invoices and stock lists, matched line by line to what actually ships."}], ctaTitle:"Come see the floor for yourself.",ctaBody:"Bring your size chart and your busiest week’s numbers. We’ll show you what’s moving and what fits your shelf.",ctaImage:"https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600",ctaImageAlt:"Iccha Store showroom",catalogEmail:"orders@icchastore.example"
};
export const defaultContact: ContactContent = {
  eyebrow:"Get in touch",title:"Questions before you order? Start here.",intro:"Reach us directly, or check the answers retailers ask most before placing their first order.",showroomTitle:"Visit the showroom",address:"Iccha Store, Shop 14, Wholesale Cloth Market, Main Road",directionsLabel:"Get directions",directionsUrl:"https://maps.google.com/?q=Wholesale+Cloth+Market",phoneTitle:"Call or WhatsApp",phone:"+91 98755 76465",whatsapp:"919147414203",whatsappLabel:"Chat on WhatsApp",hoursTitle:"Showroom hours",hours:"Mon–Sat, 10:00 AM – 8:00 PM",closed:"Closed on Sundays and market holidays",faqTitle:"Frequently asked",faqs:[{question:"What's the minimum order quantity?",answer:"MOQ is fixed per style, usually a set per size-run rather than a flat number across the catalog. Your exact minimum is confirmed when you share your requirement."},{question:"Do I need a GST number to order?",answer:"Yes — we bill every order against a GST invoice, so a valid GSTIN is needed to place a wholesale order."},{question:"Can I see samples before a bulk order?",answer:"Yes, single-piece samples are available for most styles. Sample cost is adjusted against your bulk order once confirmed."},{question:"Which cities do you dispatch to?",answer:"We ship pan-India through your choice of transport. Average dispatch time is about 48 hours from order confirmation."}],formTitle:"Send us your requirement",formIntro:"Share a few details and we’ll open WhatsApp with your enquiry ready to send.",submitLabel:"Send & Continue on WhatsApp",formNote:"Your enquiry details will be prepared in WhatsApp and sent to our business number."
};
export const defaultHomeFeatures: HomeFeaturesContent = {
  title: "Built for margin, not just volume",
  cards: [
    { icon: "Scissors", title: "Organized set lots", body: "Every design is packed in standard, market-tested size combinations — M-38, L-40, XL-42, XXL-44 — so shelves rotate without dead sizes." },
    { icon: "Building2", title: "Custom Piece of Fabric", body: "Discover a versatile range of fabrics tailored to your designs and business needs. Choose from different materials, textures, colours and prints to create distinctive collections that match your customers’ preferences." },
    { icon: "Lock", title: "Wholesale rates stay private", body: "Your retail customers never see our margins or supplier prices. Commercial access is gated behind verified KYC, every time." },
  ],
};
