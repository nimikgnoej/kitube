export const trending = (req, res) => {
  const videos = [
    {
      title: "First video",
      rating: 5,
      comments: 40,
      createdAt: "2 min ago",
      views: 2000321,
      id: 1,
    },
    {
      title: "Second video",
      rating: 4.5,
      comments: 412,
      createdAt: "3 min ago",
      views: 343200321,
      id: 2,
    },
    {
      title: "Third video",
      rating: 4.6,
      comments: 23,
      createdAt: "40 min ago",
      views: 15342158,
      id: 3,
    },
    {
      title: "Fourth video",
      rating: 5,
      comments: 4331,
      createdAt: "10 min ago",
      views: 534847,
      id: 4,
    },
  ];
  return res.render("home", { pageTitle: "Home", videos });
};
export const see = (req, res) => res.render("watch", { pageTitle: "Watch" });
export const edit = (req, res) => res.render("edit");
export const search = (req, res) => res.send("Search Video");
export const upload = (req, res) => res.send("Uploads Video");
export const deleteVideo = (req, res) => res.send("Delete Video");
