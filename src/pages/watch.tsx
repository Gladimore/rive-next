import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "@/styles/Watch.module.scss";
import { setContinueWatching } from "@/Utils/continueWatching";
import { toast } from "sonner";
import { IoReturnDownBack } from "react-icons/io5";
import { FaForwardStep, FaBackwardStep } from "react-icons/fa6";
import { BsHddStack, BsHddStackFill } from "react-icons/bs";
import axiosFetch from "@/Utils/fetchBackend";
import WatchDetails from "@/components/WatchDetails";

const Watch = () => {
  const params = useSearchParams();
  const { back, push } = useRouter();
  const [type, setType] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [season, setSeason] = useState<string | null>(null);
  const [episode, setEpisode] = useState<string | null>(null);
  const [minEpisodes, setMinEpisodes] = useState(1);
  const [maxEpisodes, setMaxEpisodes] = useState(2);
  const [maxSeason, setMaxSeason] = useState(1);
  const [nextSeasonMinEpisodes, setNextSeasonMinEpisodes] = useState(1);
  const [loading, setLoading] = useState(true);
  const [watchDetails, setWatchDetails] = useState(false);
  const [data, setData] = useState<any>(null);
  const [source, setSource] = useState("VIDSRC");
  const nextBtn = useRef(null);
  const backBtn = useRef(null);
  const moreBtn = useRef(null);

  // New stream URLs
  const STREAM_URLS = {
    VIDSRC: process.env.NEXT_PUBLIC_STREAM_URL_VIDSRC,
    VIDVIP: process.env.NEXT_PUBLIC_STREAM_URL_VIDVIP,
    EMB: process.env.NEXT_PUBLIC_STREAM_URL_EMB,
    TURBOVID: process.env.NEXT_PUBLIC_STREAM_URL_TURBOVID,
    MOVIESAPI: process.env.NEXT_PUBLIC_STREAM_URL_MOVIESAPI
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setType(params.get("type"));
      setId(params.get("id"));
      setSeason(params.get("season"));
      setEpisode(params.get("episode"));
      setContinueWatching({ type: params.get("type"), id: params.get("id") });

      if (type === "tv") {
        const res = await axiosFetch({ requestID: `${type}Data`, id });
        setData(res);
        setMaxSeason(res?.number_of_seasons);

        const seasonData = await axiosFetch({
          requestID: `tvEpisodes`,
          id,
          season,
        });

        if (seasonData?.episodes?.length > 0) {
          setMaxEpisodes(seasonData.episodes[seasonData.episodes.length - 1]?.episode_number);
          setMinEpisodes(seasonData.episodes[0]?.episode_number);

          if (parseInt(episode) >= maxEpisodes - 1) {
            const nextSeasonData = await axiosFetch({
              requestID: `tvEpisodes`,
              id,
              season: parseInt(season) + 1,
            });

            if (nextSeasonData?.episodes?.length > 0) {
              setNextSeasonMinEpisodes(nextSeasonData.episodes[0]?.episode_number);
            }
          }
        }
      }
      setLoading(false);
    };

    init();
  }, [params, id, season, episode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key === "N") {
        event.preventDefault();
        nextBtn.current?.click();
      } else if (event.shiftKey && event.key === "P") {
        event.preventDefault();
        backBtn.current?.click();
      } else if (event.shiftKey && event.key === "M") {
        event.preventDefault();
        moreBtn.current?.click();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    toast.info(
      <div>
        Cloud: use AD-Blocker services for AD-free experience, like{" "}
        <a target="_blank" href="https://brave.com/">
          Brave Browser{" "}
        </a>
      </div>,
    );

    toast.info(
      <div>
        Cloud: use video downloader extensions like{" "}
        <a target="_blank" href="https://fetchv.net/">
          FetchV{" "}
        </a>{" "}
        or{" "}
        <a target="_blank" href="https://www.hlsloader.com/">
          Stream Recorder{" "}
        </a>{" "}
        for PC and{" "}
        <a
          target="_blank"
          href="https://play.google.com/store/apps/details?id=videoplayer.videodownloader.downloader"
        >
          AVDP{" "}
        </a>{" "}
        for Android, to download movies/tv shows. Refer{" "}
        <a
          target="_blank"
          href="https://www.reddit.com/r/DataHoarder/comments/qgne3i/how_to_download_videos_from_vidsrcme/"
        >
          The Source{" "}
        </a>
      </div>,
    );
  }, []);

  const handleBackward = () => {
    if (episode > minEpisodes)
      push(`/watch?type=tv&id=${id}&season=${season}&episode=${parseInt(episode) - 1}`);
  };

  const handleForward = () => {
    if (episode < maxEpisodes)
     (`/watch?type=tv&id=${id}&season=${season}&episode=${parseInt(episode) + 1}`);
    else if (parseInt(season) + 1 <= maxSeason)
      push(`/watch?type=tv&id=${id}&season=${parseInt(season) + 1}&episode=${nextSeasonMinEpisodes}`);
  };

  const getStreamUrl = () => {
    const { VIDSRC, VIDVIP, EMB, TURBOVID, MOVIESAPI } = STREAM_URLS;
    const isMovie = type === "movie";

    switch (source) {
      case "VIDSRC":
        return isMovie
          ? `${VIDSRC}/embed/${id}`
          : `${VIDSRC}/embed/${type}/${id}/${season}/${episode}`;
      case "VIDVIP":
        return isMovie
          ? `${VIDVIP}/embed/${id}`
          : `${VIDVIP}/embed/${type}/${id}/${season}/${episode}`;
      case "EMB":
        return isMovie
          ? `${EMB}/embed/${type}/${id}`
          : `${EMB}/embed/${type}/${id}/${season}/${episode}`;
      case "TURBOVID":
        return isMovie
          ? `${TURBOVID}/embed/${type}/${id}`
          : `${TURBOVID}/embed/${type}/${id}/${season}/${episode}`;
      case "MOVIESAPI":
        return isMovie
          ? `${MOVIESAPI}?video_id=${id}&tmdb=1`
          : `${MOVIESAPI}?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;
      default:
        return "";
    }
  };

  return (
    <div className={styles.watch}>
      <div onClick={back} className={styles.backBtn}>
        <IoReturnDownBack
          data-tooltip-id="tooltip"
          data-tooltip-content="go back"
        />
      </div>

      <div className={styles.episodeControl}>
        {type === "tv" && (
          <>
            <div
              ref={backBtn}
              onClick={() => episode > minEpisodes && handleBackward()}
              data-tooltip-id="tooltip"
              data-tooltip-html={
                episode > minEpisodes
                  ? "<div>Previous episode <span class='tooltip-btn'>SHIFT + P</span></div>"
                  : `Start of season ${season}`
              }
            >
              <FaBackwardStep
                className={`${episode <= minEpisodes ? styles.inactive : null}`}
              />
            </div>

            <div
              ref={nextBtn}
              onClick={() =>
                (episode < maxEpisodes || parseInt(season) + 1 <= maxSeason) &&
                handleForward()
              }
              data-tooltip-id="tooltip"
              data-tooltip-html={
                episode < maxEpisodes
                  ? "<div>Next episode <span class='tooltip-btn'>SHIFT + N</span></div>"
                  : parseInt(season) + 1 <= maxSeason
                      ? `<div>Start season ${parseInt(season) + 1} <span class='tooltip-btn'>SHIFT + N</span></div>`
                      : `End of season ${season}`
              }
            >
              <FaForwardStep
                className={`${
                  episode >= maxEpisodes && season >= maxSeason ? styles.inactive : null
                } ${
                  episode >= maxEpisodes && season < maxSeason ? styles.nextSeason : null
                }`}
              />
            </div>
          </>
        )}
        <div
          ref={moreBtn}
          onClick={() => setWatchDetails(!watchDetails)}
          data-tooltip-id="tooltip"
          data-tooltip-html={
            !watchDetails
              ? "More <span class='tooltip-btn'>SHIFT + M</span></div>"
              : "close <span class='tooltip-btn'>SHIFT + M</span></div>"
          }
        >
          {watchDetails ? <BsHddStackFill /> : <BsHddStack />}
        </div>
      </div>

      {watchDetails && (
        <WatchDetails
          id={id}
          type={type}
          data={data}
          season={season}
          episode={episode}
          setWatchDetails={setWatchDetails}
        />
      )}

      <select
        name="source"
        id="source"
        className={styles.source}
        value={source}
        onChange={(e) => setSource(e.target.value)}
      >
        <option value="VIDSRC">VIDSRC</option>
        <option value="VIDVIP">VIDVIP</option>
        <option value="EMB">EMB</option>
        <option value="TURBOVID">TURBOVID</option>
        <option value="MOVIESAPI">MOVIESAPI</option>
      </select>

      <div className={`${styles.loader} skeleton`}></div>

      {id && (
        <iframe
          scrolling="no"
          src={getStreamUrl()}
          className={styles.iframe}
          allowFullScreen
        />
      )}
    </div>
  );
};

export default Watch;
