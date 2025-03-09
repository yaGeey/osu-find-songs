import mongoose from "mongoose";
const playlistSchema = new mongoose.Schema({
   beatmapsets: {
      type: [String],
      required: true,
   },
});
export default mongoose.models.Playlist || mongoose.model("Playlist", playlistSchema);