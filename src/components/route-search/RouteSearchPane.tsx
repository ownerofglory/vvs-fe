import {useState} from "react";
import JourneyList, {JourneyItem, JourneyRouteLeg} from "../../models/journey.ts";
import './RouteSearchPane.scss'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faAngleRight, faPersonWalking} from "@fortawesome/free-solid-svg-icons";
import {backendUrl} from "../../constants.ts";

interface RouteSearchProps {
    from?: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>
    to?: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>
    dateTime?: Date
    onRouteSelect: (route: JourneyItem) => void
}

function RouteSearchPane({from, to, dateTime, onRouteSelect}: RouteSearchProps) {
    const [routes, setRoutes] = useState<JourneyList | null>(null)

    const searchRoute = () => {
        fetch(`${backendUrl}/journeys?from=${from?.properties?.globalId}&to=${to?.properties?.globalId}`)
            .then<JourneyList>(resp => resp.json())
            .then(j => setRoutes(j))
    }

    return (
        <div>
            <div>
                <p><span>{dateTime?.toLocaleDateString()}</span></p>
                <p className={'route-point'}>From: <span>{from?.properties?.name}</span></p>
                <p className={'route-point'}>To: <span>{to?.properties?.name}</span></p>
            </div>
            <div>
                <button onClick={() => searchRoute()}>Search</button>
            </div>
            <div>
                {routes?.journeys?.map(j => {
                    const {begin, end} = getTripBeginEnd(j)
                    const duration = calculateTotalDuration(j)

                        return (
                            <div>
                                <p className={'route-times'}>
                                        <span>Depart: {begin && formatDate(begin)}</span>
                                        <span>Arrive: {end && formatDate(end)}</span>
                                </p>
                                <p onClick={() => onRouteSelect(j)} className={'route-item'}>

                                    {j.routeLegs?.map(l => (
                                        <span>
                                    <span style={getLineStyle(l.transportLine ?? 'walk')}>
                                        {l.transportLine ?? <FontAwesomeIcon color={'black'} icon={faPersonWalking}/>}
                                    </span>

                                    <FontAwesomeIcon className={'next-icon'} icon={faAngleRight}/>
                                </span>
                                    ))}
                                    <span
                                        className={'route-duration'}>{formatDuration(duration)}
                                </span>
                                </p>
                            </div>
                        )
                    }
                )}
            </div>
        </div>
    )
}

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const hoursString = hours > 0 ? `${hours}h` : "";
    const minutesString = minutes > 0 ? `${minutes}m` : "";

    return hoursString + (hours > 0 && minutes > 0 ? " " : "") + minutesString;
}

function calculateTotalDuration(journey: JourneyItem): number {
    if (!journey.routeLegs || journey.routeLegs.length === 0) {
        return 0;
    }

    const firstLeg = journey.routeLegs[0];
    const lastLeg = journey.routeLegs[journey.routeLegs.length - 1];

    const departureTime = new Date(firstLeg.departureTimeEst ?? firstLeg.departureTimePlan as string);
    const arrivalTime = new Date(lastLeg.arrivalTimeEst ?? lastLeg.arrivalTimePlan as string);

    const durationInSeconds = (arrivalTime.getTime() - departureTime.getTime()) / 1000;

    return durationInSeconds;
}

function getLineStyle(line: any) {
    const style = {
        backgroundColor: 'blue',
        color: 'white',
        padding: '0 4px 0 4px',
        borderRadius: '2px',
        marginRight: '2px',
        marginTop: '2px',
        cursor: 'pointer'
    }
    if (line.startsWith('U')) {
        style.backgroundColor = 'blue'
    } else if (line.startsWith('S')) {
        style.backgroundColor = 'green'
    } else if (line === '10' || line === '20') {
        style.backgroundColor = 'yellow'
        style.color = 'black'
    } else if (!isNaN(Number(line)) || line.startsWith('N') || line.startsWith('SEV') || line.startsWith('X')) {
        style.backgroundColor = 'red'
    } else if (line.startsWith('R') || line.startsWith('IR') || line.startsWith('IC') || line.startsWith('MEX')) {
        style.backgroundColor = 'gray'
    } else if (line === 'walk') {
        style.backgroundColor = 'lightgray'
    }
    return  style
}

function getTripBeginEnd(journey: JourneyItem): { begin: Date | undefined, end: Date | undefined } {
    if (!journey.routeLegs || journey.routeLegs.length === 0) {
        return { begin: undefined, end: undefined };
    }

    const firstLeg = journey.routeLegs[0];
    const lastLeg = journey.routeLegs[journey.routeLegs.length - 1];

    return {
        begin: firstLeg.departureTimePlan,
        end: lastLeg.arrivalTimePlan,
    };
}

function formatDate(date: any): string {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.error('Invalid date object:', date);
        return 'Invalid date';
    }

    const now = new Date();
    const isSameDay = date.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toDateString() === date.toDateString();

    const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
    };

    if (isSameDay) {
        return date.toLocaleTimeString([], options);
    } else if (isTomorrow) {
        return `Tomorrow ${date.toLocaleTimeString([], options)}`;
    } else {
        options.day = '2-digit';
        options.month = 'short';
        return date.toLocaleDateString([], options) + ' ' + date.toLocaleTimeString([], options);
    }
}

export default RouteSearchPane