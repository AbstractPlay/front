import React, { useContext } from "react";
import { SummaryContext } from "../Stats";
import Plot from 'react-plotly.js';

function SiteStats(props) {
  const [summary] = useContext(SummaryContext);

  return (
    <>
        <div>
            <div className="content">
                <p>Games are counted in seven-day chunks from the date the script ran. The right-most bar is the most recent seven days. The left-most bar is the first week completed games were recorded.</p>
            </div>
        <Plot
            data={[
                {
                    y: [...summary.histograms.all].reverse(),
                    type: "bar"
                }
            ]}
            config={
                {
                    responsive: true,
                }
            }
            layout={
                {
                    title: "Games completed per week",
                    xaxis: {title: "Week #"},
                    yaxis: {title: "Completed games"},
                    height: 500,
                }
            }
        />
        <hr />
        </div>
        <div>
            <div className="content">
                <p>"Hours per move" is calculated as an average per game. Games that end by time out or on the first turn are not counted. A box plot shows the "hours per move" for each qualifying game record and gives a sense of the spread of that data.</p>
            </div>
        <Plot
            data={[
                {
                    y: summary.hoursPer,
                    type: "box",
                    boxpoints: "outliers",
                    orientation: "v",
                    name: "Hours per move",
                    jitter: 0.3,
                }
            ]}
            config={
                {
                    responsive: true,
                }
            }
            layout={
                {
                    title: "Hours per move",
                    height: 500,
                }
            }
        />
        </div>
    </>
  )
}

export default SiteStats;


