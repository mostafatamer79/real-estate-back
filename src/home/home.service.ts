
import { Injectable } from '@nestjs/common';

@Injectable()
export class HomeService {
  getHomeData() {
    return {
      home: {
        hero: [
          {
            projectTitle: "title",
            projectDescription: "",
            donation: 3434,
            donators: 3434,
            projectId: 1,
          },
        ],
        how_it_works: {
          image: "",
          title: "",
          discription: "",
        },
        recent_projects: [
          {
            projectId: 1,
            image: "",
            projectName: "",
            created_At: "",
            country: "",
            projectDescription: "",
            progress: 50,
            goal: 3434,
            raised: 43434,
            donations: 23234,
          },
        ],
        completed_projects: [
          {
            projectId: 1,
            image: "",
            projectName: "",
            created_At: "",
            country: "",
            projectDescription: "",
            progress: 100,
            goal: 3434,
            raised: 3434,
            donations: 23234,
          },
        ],
        some_real_projects: [
          {
            title: "",
            src: "",
          },
        ],
        who_we_are: [
          {
            presonalPhoto: "",
            quote: "Together, we can change lives for the better",
            wisdome:
              "Your kindness today can improve someone’s life tomorrow. A single donation can provide clean water, food for a family, or care for someone who is struggling. Together, these small acts of generosity grow into lasting impact. By standing together and giving with compassion, we can help build a better, more caring future for everyone.",
            name: "Mohamed Mahmoud",
            position: "CEO & Founder",
          },
        ],
      },
      news: [],
      about_use: [],
      footer: [],
    };
  }
}
