import React, { useContext, useEffect, useState } from "react";
import { ResponsesContext } from "../Player";

function Response({ order }) {
  const [responses] = useContext(ResponsesContext);
  const [, movedSetter] = useState(0);
  const [avg, avgSetter] = useState(0);
  const [median, medianSetter] = useState(0);
  const [q1, q1Setter] = useState(0);
  const [q3, q3Setter] = useState(0);

  useEffect(() => {
    console.log("Update forced");
    movedSetter((m) => m + 1);
  }, [order]);

  useEffect(() => {
    if (responses !== null && responses.length > 0) {
      const hours = responses
        .map((n) => n / (1000 * 60 * 60))
        .sort((a, b) => a - b);
      const sum = hours.reduce((a, b) => a + b, 0);
      if (hours.length > 0) {
        q1Setter(hours[Math.floor(hours.length * 0.25)]);
        q3Setter(hours[Math.floor(hours.length * 0.75)]);
        avgSetter(sum / hours.length);
        medianSetter(hours[Math.floor(hours.length / 2)]);
      } else {
        avgSetter(0);
        medianSetter(0);
        q1Setter(0);
        q3Setter(0);
      }
    } else {
      avgSetter(0);
      medianSetter(0);
      q1Setter(0);
      q3Setter(0);
    }
  }, [responses]);

  return (
    <>
      <div key="Player|Response">
        <div className="content">
          <p>Average response time: {avg.toFixed(2)} hours</p>
          <p>Median response time: {median.toFixed(2)} hours</p>
          <p>
            Middle half of response times: {q1.toFixed(2)} to {q3.toFixed(2)}{" "}
            hours
          </p>
        </div>
      </div>
    </>
  );
}

export default Response;
