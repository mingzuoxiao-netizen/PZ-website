import React from 'react';
import {getStatusDefinition,OVERDUE_STATUS,STATUS_CLASSES} from './status';
type Props={status?:string|null;overdue?:boolean;className?:string;title?:string};
const StatusChip:React.FC<Props>=({status,overdue=false,className='',title})=>{
  const definition=overdue?OVERDUE_STATUS:getStatusDefinition(status);
  return <span title={title} data-status={status||''}
    className={'inline-flex shrink-0 items-center rounded border px-2 py-0.5 text-xs font-semibold '+STATUS_CLASSES[definition.tone]+' '+className}>
    {definition.label}
  </span>;
};
export default StatusChip;
