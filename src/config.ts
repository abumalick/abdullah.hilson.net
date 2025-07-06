import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://abdullah.hilson.net/",
  author: "Abdullah Hilson",
  desc: "My personal website",
  title: "Abdullah Hilson",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerPage: 3,
};

export const LOCALE = ["en-EN"]; // set to [] to use the environment default

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/abdullah-hilson-565a1455/",
    linkTitle: `${SITE.title} on LinkedIn`,
    active: true,
  },
  {
    name: "Github",
    href: "https://github.com/abumalick",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:abdullah@hilson.net",
    linkTitle: `Send an email to ${SITE.title}`,
    active: false,
  },
];
