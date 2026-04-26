import {
  Clock,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Resource } from "@/data/resources/types";

type ResourceListProps = {
  resources?: Resource[];
};

export function ResourceList({ resources = [] }: ResourceListProps) {
  if (resources.length === 0) {
    return (
    <div
      className="text-center py-12"
      style={{ color: 'var(--compass-text)', opacity: 0.6 }}
    >
      <p>No resources found that match your criteria.</p>
    </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {resources.map((resource) => (
        <Card key={resource.id} className="flex flex-col">
          <CardHeader>
            <CardTitle asChild>
              <h2>{resource.name}</h2>
            </CardTitle>
            <CardDescription>{resource.category}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            {resource.description && (
              <p className="mb-4">{resource.description}</p>
            )}
            <div className="space-y-2 text-sm">
              {resource.audiences?.length > 0 && (
                <div className="flex items-start">
                  <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>
                    {resource.audiences
                      .map((audience) =>
                        audience
                          .replace(/-/g, " ")
                          .replace(/^\w/, (c) => c.toUpperCase()),
                      )
                      .join(", ")}
                  </span>
                </div>
              )}
              {resource.schedule?.map((scheduleItem, index) => (
                <div key={index} className="flex items-start">
                  <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>
                    {scheduleItem.day}:{" "}
                    {scheduleItem.times
                      .map((time) => `${time.startTime} - ${time.endTime}`)
                      .join(" & ")}
                    {scheduleItem.frequency && ` (${scheduleItem.frequency})`}
                  </span>
                </div>
              ))}
              {resource.location && (
                <div className="flex items-start">
                  <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>{resource.location.address}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {resource.contacts?.map((contact, index) => (
                <a
                  key={index}
                  href={
                    contact.method === "email"
                      ? `mailto:${contact.value}`
                      : `tel:${contact.value}`
                  }
                  className="flex items-center hover:underline"
                >
                  {contact.method === "phone" || contact.method === "text" ? (
                    <Phone className="mr-1 h-4 w-4" />
                  ) : (
                    <Mail className="mr-1 h-4 w-4" />
                  )}
                  {contact.description || contact.value}
                </a>
              ))}
              {resource.links?.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:underline"
                >
                  <LinkIcon className="mr-1 h-4 w-4" />
                  {link.type.charAt(0).toUpperCase() + link.type.slice(1)}
                </a>
              ))}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
