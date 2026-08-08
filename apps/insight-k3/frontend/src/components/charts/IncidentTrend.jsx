import {
LineChart,
Line,
XAxis,
YAxis,
CartesianGrid,
Tooltip,
ResponsiveContainer
} from "recharts";


import { incidentData } from "../../services/incidentData";


function IncidentTrend(){


return(

<div style={{
width:"100%",
height:350
}}>


<ResponsiveContainer>


<LineChart data={incidentData.monthly}>


<CartesianGrid strokeDasharray="3 3"/>


<XAxis 
dataKey="month"
/>


<YAxis />


<Tooltip />



<Line

type="monotone"

dataKey="incident"

stroke="#e53935"

strokeWidth={3}

/>


</LineChart>


</ResponsiveContainer>


</div>

)


}


export default IncidentTrend;