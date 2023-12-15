function polarToCartesian(centerX, centerY, radius, anglePolar)
{
	var angleCartesian = (anglePolar-90) * Math.PI / 180.0;

	return {
		x: centerX + (radius * Math.cos(angleCartesian)),
		y: centerY + (radius * Math.sin(angleCartesian))
	};
}

function createMotionDetectionSensitivityAdvancedElement(x, y, radius, startAngle, endAngle)
{
	var a = polarToCartesian(x, y, radius, startAngle);
	var b = polarToCartesian(x, y, radius, endAngle);
	var c = polarToCartesian(x, y, radius-40, endAngle);
	var d = polarToCartesian(x, y, radius-40, startAngle);

	var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
	var res = [
		"M", a.x, a.y, 
		"A", radius, radius, 0, largeArcFlag, 1, b.x, b.y,
		"L", c.x, c.y, 
		"A", radius, radius, 0, largeArcFlag, 0, d.x, d.y,
		"Z"
	].join(" ");

	return res;
}

function createMotionDetectionSensitivityAdvancedRangeText(x, y, radius, startAngle)
{
	var pos = polarToCartesian(x, y, radius, startAngle);
	pos.x = pos.x;
	pos.y = pos.y + 5;
	return pos;
}

function createMotionDetectionSensitivityAdvancedSector(motionDetectionSensitivityAdvanced, sectorName, startX, startY, maxRadius, segments, startAngle, endAngle)
{
	var svgSector = "";
	for(let i = 1; i <= segments; i++)
	{
		svgSector += `<path id="motionDetectionSensitivityAdvanced${sectorName}${i}" fill="${motionDetectionSensitivityAdvanced >= i ? "#446688" : "none"}" stroke="#B5BABE" stroke-width="1" d="${createMotionDetectionSensitivityAdvancedElement(startX, startY, i*maxRadius/segments, startAngle, endAngle)}" />`;
	}
	var radiusSectorStartAngle = startAngle + ((endAngle - startAngle) / 2);
	var positionSectorLabel = createMotionDetectionSensitivityAdvancedRangeText(startX, startY, maxRadius+10, radiusSectorStartAngle);
	svgSector += `<text id="motionDetectionSensitivityAdvanced${sectorName}Label" font-size="smaller" text-anchor="middle" dominant-baseline="auto" fill="black" x="${positionSectorLabel.x}" y="${positionSectorLabel.y}">${sectorName}</text>`;
	return svgSector;
}

function createMotionDetectionSensitivityAdvancedSegmentLabels(startX, startY, maxRadius, segments, startAngle)
{
	var svgSegmentLabel = "";
	var labelContent = ["3ft", "6ft", "10ft", "15ft", "20ft"];
	for(let i = 1; i <= segments; i++)
	{
		var positionSegmentLabel = createMotionDetectionSensitivityAdvancedRangeText(startX, startY, i*maxRadius/segments, startAngle);
		svgSegmentLabel += `<text id="motionDetectionSensitivityAdvancedDistance${labelContent[i]}" font-size="smaller" text-anchor="middle" dominant-baseline="hanging" fill="black" x="${positionSegmentLabel.x}" y="${positionSegmentLabel.y}">${translateDeviceStateValue(labelContent[i-1])}</text>`;
	}
	return svgSegmentLabel;
}

function createMotionDetectionSensitivityAdvancedImage(deviceProperties, startX, startY)
{
	return `
													<svg viewBox="0 0 450 220" height="220" width="100%"">
														${createMotionDetectionSensitivityAdvancedSector(deviceProperties.motionDetectionSensitivityAdvancedA, "A", startX, startY, 200, 5, -72, -54)};
														${createMotionDetectionSensitivityAdvancedSector(deviceProperties.motionDetectionSensitivityAdvancedB, "B", startX, startY, 200, 5, -54, -36)};
														${createMotionDetectionSensitivityAdvancedSector(deviceProperties.motionDetectionSensitivityAdvancedC, "C", startX, startY, 200, 5, -36, -18)};
														${createMotionDetectionSensitivityAdvancedSector(deviceProperties.motionDetectionSensitivityAdvancedD, "D", startX, startY, 200, 5, -18, 0)};
														${createMotionDetectionSensitivityAdvancedSector(deviceProperties.motionDetectionSensitivityAdvancedE, "E", startX, startY, 200, 5, 0, 18)};
														${createMotionDetectionSensitivityAdvancedSector(deviceProperties.motionDetectionSensitivityAdvancedF, "F", startX, startY, 200, 5, 18, 36)};
														${createMotionDetectionSensitivityAdvancedSector(deviceProperties.motionDetectionSensitivityAdvancedG, "G", startX, startY, 200, 5, 36, 54)};
														${createMotionDetectionSensitivityAdvancedSector(deviceProperties.motionDetectionSensitivityAdvancedH, "H", startX, startY, 200, 5, 54, 72)};
														${createMotionDetectionSensitivityAdvancedSegmentLabels(startX, startY, 200, 5, -72)}
													</svg>`;
}