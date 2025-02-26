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
  const [type, setType] = useState<string | null>("");
  const [id, setId] = useState<any>();
  const [season, setSeason] = useState<any>();
  const [episode, setEpisode] = useState<any>();
  const [minEpisodes, setMinEpisodes] = useState(1);
  const [maxEpisodes, setMaxEpisodes] = useState(2);
  const [maxSeason, setMaxSeason] = useState(1);
  const [nextSeasonMinEpisodes, setNextSeasonMinEpisodes] = useState(1);
  const [loading, setLoading] = useState(true);
  const [watchDetails, setWatchDetails] = useState(false);
  const [data, setdata] = useState<any>();
  const [source, setSource] = useState("TURBO");
  const nextBtn: any = useRef(null);
  const backBtn: any = useRef(null);
  const moreBtn: any = useRef(null);

  if (type === null && params.get("id") !== null) setType(params.get("type"));
  if (id === null && params.get("id") !== null) setId(params.get("id"));
  if (season === null && params.get("season") !== null)
    setSeason(params.get("season"));
  if (episode === null && params.get("episode") !== null)
    setEpisode(params.get("episode"));

  useEffect(() => {
    setLoading(true);
    setType(params.get("type"));
    setId(params.get("id"));
    setSeason(params.get("season"));
    setEpisode(params.get("episode"));
    setContinueWatching({ type: params.get("type"), id: params.get("id") });
    const fetch = async () => {
      const res: any = await axiosFetch({ requestID: `${type}Data`, id: id });
      setdata(res);
      setMaxSeason(res?.number_of_seasons);
      const seasonData = await axiosFetch({
        requestID: `tvEpisodes`,
        id: id,
        season: season,
      });
      seasonData?.episodes?.length > 0 &&
        setMaxEpisodes(
          seasonData?.episodes[seasonData?.episodes?.length - 1]?.episode_number
        );
      setMinEpisodes(seasonData?.episodes[0]?.episode_number);
      if (parseInt(episode) >= maxEpisodes - 1) {
        var nextseasonData = await axiosFetch({
          requestID: `tvEpisodes`,
          id: id,
          season: parseInt(season) + 1,
        });
        nextseasonData?.episodes?.length > 0 &&
          setNextSeasonMinEpisodes(
            nextseasonData?.episodes[0]?.episode_number
          );
      }
    };
    if (type === "tv") fetch();

    const handleKeyDown = (event: any) => {
      if (event.shiftKey && event.key === "N") {
        event.preventDefault();
        nextBtn?.current.click();
      } else if (event.shiftKey && event.key === "P") {
        event.preventDefault();
        backBtn?.current.click();
      } else if (event.shiftKey && event.key === "M") {
        event.preventDefault();
        moreBtn?.current.click();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [params, id, season, episode]);

  useEffect(() => {
    // Block window.close() for any iframe content
    const blockClose = () => {
      window.close = () => {
        console.log("Blocked window.close() attempt.");
      };
    };

    blockClose();

    return () => {
      // Cleanup (restore the original behavior if needed)
      window.close = () => {};
    };
  }, []);

  useEffect(() => {
    toast.info(
      <div>
        Cloud: use AD-Blocker services for AD-free experience, like AD-Blocker
        extension or{" "}
        <a target="_blank" href="https://brave.com/">
          Brave Browser{" "}
        </a>
      </div>
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
      </div>
    );
  }, []);

  // New STREAM_URLS object with updated keys
  const STREAM_URLS = {
    SRC: process.env.NEXT_PUBLIC_STREAM_URL_SRC,
    VIP: process.env.NEXT_PUBLIC_STREAM_URL_VIP,
    EMB: process.env.NEXT_PUBLIC_STREAM_URL_EMB,
    TURBO: process.env.NEXT_PUBLIC_STREAM_URL_TURBO,
    CLUB: process.env.NEXT_PUBLIC_STREAM_URL_CLUB,
    DEV: process.env.NEXT_PUBLIC_STREAM_URL_DEV,
  };

  function handleBackward() {
    if (episode > minEpisodes)
      push(
        `/watch?type=tv&id=${id}&season=${season}&episode=${parseInt(
          episode
        ) - 1}`
      );
  }

  function handleForward() {
    if (episode < maxEpisodes)
      push(
        `/watch?type=tv&id=${id}&season=${season}&episode=${parseInt(
          episode
        ) + 1}`
      );
    else if (parseInt(season) + 1 <= maxSeason)
      push(
        `/watch?type=tv&id=${id}&season=${parseInt(season) + 1}&episode=${nextSeasonMinEpisodes}`
      );
  }

  return (
    <div className={styles.watch}>
      <div onClick={() => back()} className={styles.backBtn}>
        <IoReturnDownBack
          data-tooltip-id="tooltip"
          data-tooltip-content="go back"
        />
      </div>
      <div className={styles.episodeControl}>
        {type === "tv" ? (
          <>
            <div
              ref={backBtn}
              onClick={() => {
                if (episode > 1) handleBackward();
              }}
              data-tooltip-id="tooltip"
              data-tooltip-html={
                episode > minEpisodes
                  ? "<div>Previous episode <span class='tooltip-btn'>SHIFT + P</span></div>"
                  : `Start of season ${season}`
              }
            >
              <FaBackwardStep
                className={`${
                  episode <= minEpisodes ? styles.inactive : ""
                }`}
              />
            </div>
            <div
              ref={nextBtn}
              onClick={() => {
                if (episode < maxEpisodes || parseInt(season) + 1 <= maxSeason)
                  handleForward();
              }}
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
                  episode >= maxEpisodes && season >= maxSeason
                    ? styles.inactive
                    : episode >= maxEpisodes && season < maxSeason
                    ? styles.nextSeason
                    : ""
                }`}
              />
            </div>
          </>
        ) : null}
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
        <option value="TURBO">TurboVid : 1</option>
        <option value="SRC">VideoSrc : 2</option>
        <option value="VIP">VideoVIP : 3</option>
        <option value="EMB">Embed : 4</option>
        <option value="CLUB">Club : 5</option>
        <option value="DEV">Dev : 6</option>
      </select>
      <div className={`${styles.loader} skeleton`}></div>

      {source === "SRC" && id && (
        <iframe
          scrolling="no"
          src={
            type === "movie"
              ? `${STREAM_URLS.SRC}/embed/movie/${id}`
              : `${STREAM_URLS.SRC}/embed/tv/${id}/${season}/${episode}`
          }
          className={styles.iframe}
          allowFullScreen
        ></iframe>
      )}

      {source === "VIP" && id && (
        <iframe
          scrolling="no"
          src={
            type === "movie"
              ? `${STREAM_URLS.VIP}/embed/movie/${id}`
              : `${STREAM_URLS.VIP}/embed/tv/${id}/${season}/${episode}`
          }
          className={styles.iframe}
          allowFullScreen
        ></iframe>
      )}

      {source === "EMB" && id && (
        <iframe
          scrolling="no"
          src={
            type === "movie"
              ? `${STREAM_URLS.EMB}/embed/movie/${id}`
              : `${STREAM_URLS.EMB}/embed/tv/${id}/${season}/${episode}`
          }
          className={styles.iframe}
          allowFullScreen
        ></iframe>
      )}

      {source === "TURBO" && id && (
        <iframe
          scrolling="no"
          src={
            type === "movie"
              ? `${STREAM_URLS.TURBO}/api/req/movie/${id}`
              : `${STREAM_URLS.TURBO}/api/req/tv/${id}/${season}/${episode}`
          }
          className={styles.iframe}
          allowFullScreen
        ></iframe>
      )}

      {source === "CLUB" && id && (
        <iframe
          scrolling="no"
          src={
            type === "movie"
              ? `${STREAM_URLS.CLUB}/movie/${id}`
              : `${STREAM_URLS.CLUB}/tv/${id}-${season}-${episode}`
          }
          className={styles.iframe}
          allowFullScreen
        ></iframe>
      )}

      {source === "DEV" && id && (
        <iframe
          scrolling="no"
          src={
            type === "movie"
              ? `${STREAM_URLS.DEV}/embed/movie/${id}`
              : `${STREAM_URLS.DEV}/embed/tv/${id}/${season}/${episode}`
          }
          className={styles.iframe}
          allowFullScreen
        ></iframe>
      )}
    </div>
  );
};

export default Watch;
