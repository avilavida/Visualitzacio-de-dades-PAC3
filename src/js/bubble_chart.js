function createAggregatedBubbleChart(containerId) {
    const margin = { top: 50, right: 170, bottom: 40, left: 70 };
    const width = 1020 - margin.left - margin.right;
    const height = 550 - margin.top - margin.bottom;
  
    const svg = d3.select(containerId).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .text("Segmentació del turisme als resorts portuguesos");
  
    const xScale = d3.scaleLinear().domain([72, 117]).range([0, width]);
    const yScale = d3.scaleLinear().domain([2.5, 7]).range([height, 0]);
    const sizeScale = d3.scaleSqrt().domain([8, 1866]).range([1, 25]);
  
    const colorScale = d3.scaleLinear()
      .domain([0, 25, 50])
      .range(["#a2fa73", "#f5e900", "#f50000"]);

    const midX = xScale.domain()[0] + (xScale.domain()[1] - xScale.domain()[0]) / 2;
    const midY = yScale.domain()[0] + (yScale.domain()[1] - yScale.domain()[0]) / 2;

    svg.append("line")
      .attr("x1", xScale(midX))
      .attr("x2", xScale(midX))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#999")
      .attr("stroke-dasharray", "4")
      .attr("stroke-width", 1.5);

    svg.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", yScale(midY))
      .attr("y2", yScale(midY) + 10)
      .attr("stroke", "#999")
      .attr("stroke-dasharray", "4")
      .attr("stroke-width", 1.5);

    svg.append("text")
      .attr("x", xScale(midX) + 10)
      .attr("y", 10)
      .text("Clients premium amb estades llargues")
      .style("font-size", "12px")
      .style("fill", "#666");

    svg.append("text")
      .attr("x", 10)
      .attr("y", 10)
      .text("Clients sensibles al preu però fidels")
      .style("font-size", "12px")
      .style("fill", "#666");

    svg.append("text")
      .attr("x", 10)
      .attr("y", height - 10)
      .text("Clients de pas o ofertes econòmiques")
      .style("font-size", "12px")
      .style("fill", "#666");

    svg.append("text")
      .attr("x", xScale(midX) + 10)
      .attr("y", height - 10)
      .text("Clients amb alta capacitat adquisitiva però fugaços")
      .style("font-size", "12px")
      .style("fill", "#666");
  
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale));
    svg.append("g").call(d3.axisLeft(yScale));
  
    svg.append("text")
      .attr("class", "x axis-label")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Despesa mitjana per nit (ADR)");
  
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
  
    const colorStops = [0, 25, 50];
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
  
    d3.csv("data/resort_2016.csv", d3.autoType).then(data => {
      const dataByCountry = d3.rollup(
        data,
        values => {
          const totalReserves = d3.sum(values, d => d.num_reserves);
          return {
            country: values[0].country,
            num_reserves: totalReserves,
            adr_promig: d3.sum(values, d => d.adr_promig * d.num_reserves) / totalReserves,
            nits_total: d3.mean(values, d => d.nits_total),
            percent_cancel: d3.sum(values, d => d.percent_cancel * d.num_reserves) / totalReserves,
          };
        },
        d => d.country
      );
  
      const aggregatedData = Array.from(dataByCountry.values());
  
      svg.selectAll("circle")
        .data(aggregatedData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.adr_promig))
        .attr("cy", d => yScale(d.nits_total))
        .attr("r", d => sizeScale(d.num_reserves))
        .attr("fill", d => colorScale(d.percent_cancel))
        .attr("opacity", d => 0.8);
  

      svg.selectAll("text.label")
        .data(aggregatedData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.adr_promig))
        .attr("y", d => yScale(d.nits_total) - 10)
        .text(d => d.country)
        .attr("opacity", 1);
    });
}

createAggregatedBubbleChart("#chart-4");