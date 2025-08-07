import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Stack, STACK_DESCRIPTIONS } from "../../lib/stacks";
import StackLabel from "../core/StackLabel";

interface Props {
  stack: Stack | undefined;
  setStack: (config: Stack) => void;
  label?: string;
  shouldDisableUpdates?: boolean;
}

function OutputSettingsSection({
  stack,
  setStack,
  label = "Generating:",
  shouldDisableUpdates = false,
}: Props) {
  return (
    <div className="flex flex-col gap-y-2 justify-between text-sm">
      <div className={label ? "grid grid-cols-3 items-center gap-4" : "flex items-center"}>
        {label && <span>{label}</span>}
        <Select
          value={stack}
          onValueChange={(value: string) => setStack(value as Stack)}
          disabled={shouldDisableUpdates}
        >
          <SelectTrigger className={label ? "col-span-2" : "w-full"} id="output-settings-js">
            {stack ? <StackLabel stack={stack} /> : "Select a stack"}
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.values(Stack).map((stack) => (
                <SelectItem key={stack} value={stack}>
                  <div className="flex items-center">
                    <StackLabel stack={stack} />
                    {STACK_DESCRIPTIONS[stack].inBeta && (
                      <Badge className="ml-2" variant="secondary">
                        Beta
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default OutputSettingsSection;
