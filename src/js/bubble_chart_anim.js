function createBubbleChart(containerId, buttonId, highlightedCountries) {
  const margin = { top: 50, right: 170, bottom: 40, left: 70 };
  const width = 1020 - margin.left - margin.right;
  const height = 550 - margin.top - margin.bottom;

  // Crear SVG
  const svg = d3.select(containerId).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .style("background-color", "#ffffff")
    .style("padding", "20px")
    .style("border-radius", "10px");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .text("Comportament temporal de les reserves: preu, estada i cancel·lacions");

  const dateLabel = svg.append("text")
    .attr("class", "date-label")
    .attr("x", width)
    .attr("y", 40)
    .attr("text-anchor", "end")
    .style("font-size", "46px")
    .style("font-weight", "bold")
    .style("fill", "#000078")
    .text("");

  // Escales
  const xScale = d3.scaleLinear().domain([30, 230]).range([0, width]);
  const yScale = d3.scaleLinear().domain([1, 9]).range([height, 0]);
  const sizeScale = d3.scaleSqrt().domain([8, 1866]).range([1, 45]);

  const colorScale = d3.scaleLinear()
    .domain([0, 37.5, 75])
    .range(["#a2fa73", "#f5e900", "#f50000"]);

  // Eixos
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale));

  svg.append("g")
    .call(d3.axisLeft(yScale));

  // Eix X: títol a sota de l’eix
  // Eix X: títol a sota de l’eix
  svg.append("text")
    .attr("class", "x axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Despesa mitjana per nit (ADR)");

  // Eix Y: títol rotat, a l’esquerra
  svg.append("text")
    .attr("class", "y axis-label")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 20)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .style("font-size", "14px")
    .text("Promig de nits reservades");

  const legendColor = svg.append("g")
    .attr("transform", `translate(${width + 15}, 200)`);

  legendColor.append("text")
    .attr("x", 0)
    .attr("y", -10)
    .text("% Cancel·lacions")
    .style("font-weight", "bold")
    .style("font-size", "12px");

  const colorStops = [0, 37.5, 75];
  const colorLabels = ["Baix", "Mitjà", "Alt"];

  colorStops.forEach((d, i) => {
    legendColor.append("rect")
      .attr("x", 0)
      .attr("y", i * 20)
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", colorScale(d));

    legendColor.append("text")
      .attr("x", 30)
      .attr("y", i * 20 + 15)
      .text(`${colorLabels[i]} (${d}%)`)
      .style("font-size", "12px");
  });

  legendColor.append("text")
    .attr("x", 0)
    .attr("y", 100)
    .text("(*) La mida dels cercles ")
    .style("font-size", "11px")
    .style("font-style", "italic")
    .style("font-weight", "bold");

    legendColor.append("text")
    .attr("x", 0)
    .attr("y", 115)
    .text("indica el nombre de reserves")
    .style("font-size", "11px")
    .style("font-style", "italic")
    .style("font-weight", "bold");

  // Línies de graella verticals (eix X)
  svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat("")
    );

  // Línies de graella horitzontals (eix Y)
  svg.append("g")
    .attr("class", "grid")
    .call(
      d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat("")
    );

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function formatPeriod(dateObj) {
    const year = dateObj.getFullYear();
    const monthName = monthNames[dateObj.getMonth()];
    return `${year}-${monthName}`;
  }


  // Carregar dades
  d3.csv("data/resort_2016.csv", d3.autoType).then(data => {
    const dataByPeriod = d3.group(data, d => d.periode);
    const parsePeriod = d3.timeParse("%Y-%m");
    const periods = Array.from(dataByPeriod.keys())
      .map(d => ({ original: d, date: parsePeriod(d) }))
      .sort((a, b) => d3.ascending(a.date, b.date))
      .map(d => d.original);
    let currentIndex = 0;
    let isPlaying = false;
    let timeoutId = null;

    function update() {

      const period = periods[currentIndex];
      const periodData = dataByPeriod.get(period);

      dateLabel.text(formatPeriod(period));

      const bubbles = svg.selectAll("circle")
        .data(periodData, d => d.country);

      bubbles.exit()
        .transition().duration(1000)
        .attr("r", 0)
        .remove();

      bubbles.enter()
        .append("circle")
        .attr("cx", d => xScale(d.adr_promig))
        .attr("cy", d => yScale(d.nits_total))
        .attr("r", 0)
        .attr("fill", d => colorScale(d.percent_cancel))
        .attr("opacity", d => {
          if (highlightedCountries.length === 0) return 0.8;
          return (highlightedCountries.includes(d.country) ? 1 : 0.3)
        })
        .merge(bubbles)
        .transition().duration(1000)
        .attr("cx", d => xScale(d.adr_promig))
        .attr("cy", d => yScale(d.nits_total))
        .attr("r", d => sizeScale(d.num_reserves))
        .attr("fill", d => colorScale(d.percent_cancel))
        .attr("stroke", d => {
          if (highlightedCountries.length === 0) return "none";
          return (highlightedCountries.includes(d.country) ? "#000" : "none")
        })
        .attr("stroke-width", d => {
          if (highlightedCountries.length === 0) return 0;
          return (highlightedCountries.includes(d.country) ? 2.5 : 0)
        });

      const labels = svg.selectAll("text.label")
        .data(periodData, d => d.country);

      labels.exit().remove();

      labels.enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.adr_promig))
        .attr("y", d => yScale(d.nits_total) - 10)
        .text(d => d.country)
        .attr("opacity", 0)
        .merge(labels)
        .transition().duration(1000)
        .attr("x", d => xScale(d.adr_promig))
        .attr("y", d => yScale(d.nits_total) - 10)
        .attr("opacity", 1);

      currentIndex = (currentIndex + 1) % periods.length;
      if (isPlaying) {
        timeoutId = setTimeout(update, 1500);
      }
    }

    d3.select(buttonId).on("click", () => {
      const btn = d3.select(buttonId);
      const icon = d3.select("#btnIcon");
    
      if (isPlaying) {
        isPlaying = false;
        clearTimeout(timeoutId);
        btn.html('<span id="btnIcon" class="bi bi-play-fill"></span>');
      } else {
        isPlaying = true;
        btn.html('<span id="btnIcon" class="bi bi-pause-fill"></span>');
        update();
      }
    });

    update();
  });
}

createBubbleChart("#chart-1", "#playPauseBtn-1", []);
createBubbleChart("#chart-2", "#playPauseBtn-2", ["GBR", "IRL"]);
createBubbleChart("#chart-3", "#playPauseBtn-3", ["ESP"]);