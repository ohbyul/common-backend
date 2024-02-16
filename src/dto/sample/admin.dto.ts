import { Props } from "./props.dto";

export class Admin {
    id: string;
    adminId: string;
    name: string;
    address: string;
}

export type AdminDto = Props<Admin>
