import { useState, useEffect, useRef, useCallback } from "react";
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

  // Extract query params
  const typeParam = params.get("type");
  const idParam = params.get("id");
  const seasonParam = params.get("season");
  const episodeParam = params.get("episode");

  // Initialize state based on query parameters
  const [type, setType] = useState<string | null>(typeParam);
  const [id, setId] = useState<string | null>(idParam);
  const [season, setSeason] = useState<string | null>(seasonParam);
  const [episode, setEpisode] = useState<string | null>(episodeParam);

  const [minEpisodes, setMinEpisodes] = useState<number>(1);
  const [maxEpisodes, setMaxEpisodes] = useState<number>(2);
  const [maxSeason, setMaxSeason] = useState<number>(1);
  const [nextSeasonMinEpisodes, setNextSeasonMinEpisodes] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [watchDetails, setWatchDetails] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [source, setSource] = useState("SUP");

  // Refs for keyboard shortcut buttons
  const nextBtn = useRef<HTMLDivElement>(null);
  const backBtn = useRef<HTMLDivElement>(null);
  const moreBtn = useRef<HTMLDivElement>(null);

  // Update state when query params change
  useEffect(() => {
    setType(typeParam);
    setId(idParam);
    setSeason(seasonParam);
    setEpisode(episodeParam);
    if (typeParam && idParam) {
      setContinueWatching({ type: typeParam, id: idParam });
    }
  }, [typeParam, idParam, seasonParam, episodeParam]);

  // Fetch data if type is tv
  useEffect(() => {
    if (type !== "tv" || !id || !season || !episode) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axiosFetch({ requestID: `${type}Data`, id });
        setData(res);
        setMaxSeason(res?.number_of_seasons || 1);
        const seasonData = await axiosFetch({
          requestID: "tvEpisodes",
          id,
          season,
        });
        if (seasonData?.episodes?.length) {
          const episodesArr = seasonData.episodes;
          setMaxEpisodes(episodesArr[episodesArr.length - 1].episode_number);
          setMinEpisodes(episodesArr[0].episode_number);
          if (parseInt(episode) >= episodesArr[episodesArr.length - 1].episode_number - 1) {
            const nextSeasonData = await axiosFetch({
              requestID: "tvEpisodes",
              id,
              season: (parseInt(season) + 1).toString(),
            });
            if (nextSeasonData?.episodes?.length) {
              setNextSeasonMinEpisodes(nextSeasonData.episodes[0].episode_number);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, id, season, episode]);

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.shiftKey) {
      switch (event.key) {
        case "N":
          event.preventDefault();
          nextBtn.current?.click();
          break;
        case "P":
          event.preventDefault();
          backBtn.current?.click();
          break;
        case "M":
          event.preventDefault();
          moreBtn.current?.click();
          break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Display useful toast notifications
  useEffect(() => {
    toast.info(
      <div>
        Cloud: use AD-Blocker services for an ad-free experience, such as the{" "}
        <a target="_blank" rel="noopener noreferrer" href="https://brave.com/">
          Brave Browser
        </a>
      </div>
    );

    toast.info(
      <div>
        Cloud: use video downloader extensions like{" "}
        <a target="_blank" rel="noopener noreferrer" href="https://fetchv.net/">
          FetchV
        </a>{" "}
        or{" "}
        <a target="_blank" rel="noopener noreferrer" href="https://www.hlsloader.com/">
          Stream Recorder
        </a>{" "}
        for PC and{" "}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://play.google.com/store/apps/details?id=videoplayer.videodownloader.downloader"
        >
          AVDP
        </a>{" "}
        for Android. Refer to{" "}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.reddit.com/r/DataHoarder/comments/qgne3i/how_to_download_videos_from_vidsrcme/"
        >
          The Source
        </a>
      </div>
    );
  }, []);

  // Navigation handlers for episodes
  const handleBackward = () => {
    if (episode && parseInt(episode) > minEpisodes) {
      push(`/watch?type=tv&id=${id}&season=${season}&episode=${parseInt(episode) - 1}`);
    }
  };

  const handleForward = () => {
    if (episode && parseInt(episode) < maxEpisodes) {
      push(`/watch?type=tv&id=${id}&season=${season}&episode=${parseInt(episode) + 1}`);
    } else if (season && parseInt(season) < maxSeason) {
      push(
        `/watch?type=tv&id=${id}&season=${parseInt(season) + 1}&episode=${nextSeasonMinEpisodes}`
      );
    }
  };

  // Environment streaming URLs
  const STREAM_URLS = {
    AGG: process.env.NEXT_PUBLIC_STREAM_URL_AGG,
    VID: process.env.NEXT_PUBLIC_STREAM_URL_VID,
    PRO: process.env.NEXT_PUBLIC_STREAM_URL_PRO,
    EMB: process.env.NEXT_PUBLIC_STREAM_URL_EMB,
    MULTI: process.env.NEXT_PUBLIC_STREAM_URL_MULTI,
    SUP: process.env.NEXT_PUBLIC_STREAM_URL_SUP,
  };

  // Helper to generate iframe source URL
  const getIframeSrc = () => {
    if (!id) return "";
    const baseUrl = STREAM_URLS[source];
    if (!baseUrl) return "";
    if (type === "movie") {
      return source === "MULTI"
        ? `${baseUrl}?video_id=${id}&tmdb=1`
        : source === "SUP"
        ? `${baseUrl}/?video_id=${id}&tmdb=1`
        : `${baseUrl}/embed/${type}/${id}`;
    }
    // For TV shows
    return source === "MULTI"
      ? `${baseUrl}?video_id=${id}&tmdb=1&s=${season}&e=${episode}`
      : source === "SUP"
      ? `${baseUrl}/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`
      : `${baseUrl}/embed/${id}/${season}/${episode}`;
  };

  return (
    <div className={styles.watch}>
      <div onClick={back} className={styles.backBtn}>
        <IoReturnDownBack data-tooltip-id="tooltip" data-tooltip-content="go back" />
      </div>
      {type === "tv" && (
        <div className={styles.episodeControl}>
          <div
            ref={backBtn}
            onClick={handleBackward}
            data-tooltip-id="tooltip"
            data-tooltip-html={
              parseInt(episode || "1") > minEpisodes
                ? `<div>Previous episode <span class='tooltip-btn'>SHIFT + P</span></div>`
                : `Start of season ${season}`
            }
          >
            <FaBackwardStep
              className={parseInt(episode || "1") <= minEpisodes ? styles.inactive : ""}
            />
          </div>
          <div
            ref={nextBtn}
            onClick={handleForward}
            data-tooltip-id="tooltip"
            data-tooltip-html={
              parseInt(episode || "1") < maxEpisodes
                ? `<div>Next episode <span class='tooltip-btn'>SHIFT + N</span></div>`
                : parseInt(season || "1") < maxSeason
                ? `<div>Start season ${parseInt(season || "1") + 1} <span class='tooltip-btn'>SHIFT + N</span></div>`
                : `End of season ${season}`
            }
          >
            <FaForwardStep
              className={
                parseInt(episode || "1") >= maxEpisodes && parseInt(season || "1") >= maxSeason
                  ? styles.inactive
                  : parseInt(episode || "1") >= maxEpisodes && parseInt(season || "1") < maxSeason
                  ? styles.nextSeason
                  : ""
              }
            />
          </div>
          <div
            ref={moreBtn}
            onClick={() => setWatchDetails((prev) => !prev)}
            data-tooltip-id="tooltip"
            data-tooltip-html={
              !watchDetails
                ? "<div>More <span class='tooltip-btn'>SHIFT + M</span></div>"
                : "<div>Close <span class='tooltip-btn'>SHIFT + M</span></div>"
            }
          >
            {watchDetails ? <BsHddStackFill /> : <BsHddStack />}
          </div>
        </div>
      )}
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
        <option value="AGG">Aggregator : 1 (Multi-Server)</option>
        <option value="VID">Aggregator : 2 (Best-Server)</option>
        <option value="PRO">Aggregator : 3 (HQ-Server)</option>
        <option value="EMB">Aggregator : 4</option>
        <option value="MULTI">Aggregator : 5 (Fast-Server)</option>
        <option value="SUP">Aggregator : 6 (Multi/Most-Server)</option>
      </select>
      <div className={`${styles.loader} skeleton`}></div>
      {!loading && id && (
        <iframe
          scrolling="no"
          src={getIframeSrc()}
          className={styles.iframe}
          allowFullScreen
        ></iframe>
      )}
    </div>
  );
};

export default Watch;
