import {
  Clock,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  Users,
  BadgeCheck,
  Banknote,
  AlertTriangle,
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {resources.map((resource) => (
        <Card key={resource.id} className="flex flex-col overflow-hidden transition-all hover:shadow-md border-2" style={{ borderColor: 'var(--compass-border)' }}>
          {resource.images && resource.images.length > 0 && (
            <div className="h-48 w-full overflow-hidden">
              <img 
                src={resource.images[0]} 
                alt={resource.name} 
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
            </div>
          )}
          <CardHeader className="relative">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl font-black">{resource.name}</CardTitle>

                <CardDescription className="font-medium text-[var(--compass-primary)]">
                  {resource.category.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
                </CardDescription>
              </div>
              {resource.isOrganiserVerified && (
                <div className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 border border-blue-100">
                  <BadgeCheck className="h-3 w-3" />
                  <span>VERIFIED</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            {resource.description && (
              <p className="mb-4 text-sm leading-relaxed text-[var(--compass-text)]/80 line-clamp-3">{resource.description}</p>
            )}
            <div className="space-y-3 text-sm">
              {resource.cost && (
                <div className="flex items-center font-bold" style={{ color: 'var(--compass-text)' }}>
                  <Banknote className="mr-2 h-4 w-4 flex-shrink-0 text-[var(--compass-success)]" />
                  <span>
                    {resource.cost.type === 'free' ? 'Free' : 
                     resource.cost.type === 'donation' ? 'By Donation' : 
                     `${resource.cost.currency || '£'}${resource.cost.amount}`}
                    {resource.cost.description && ` (${resource.cost.description})`}
                  </span>
                </div>
              )}
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
                  <span>{resource.location.name}, {resource.location.address}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4 border-t bg-gray-50/50 p-4">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {resource.contacts?.map((contact, index) => (
                <a
                  key={index}
                  href={
                    contact.method === "email"
                      ? `mailto:${contact.value}`
                      : `tel:${contact.value}`
                  }
                  className="flex items-center font-medium hover:underline text-[var(--compass-primary)]"
                >
                  {contact.method === "phone" || contact.method === "text" ? (
                    <Phone className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {contact.description || contact.value}
                </a>
              ))}
              {resource.links?.map((link, index) => (
                <div key={index} className="group relative">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center font-medium hover:underline text-[var(--compass-primary)]"
                  >
                    <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
                    {link.type.charAt(0).toUpperCase() + link.type.slice(1)}
                  </a>
                  <div className="invisible absolute bottom-full left-0 mb-2 w-48 rounded bg-gray-900 p-2 text-[10px] text-white opacity-0 transition-all group-hover:visible group-hover:opacity-100 z-10">
                    <div className="flex items-center gap-1 mb-1 text-yellow-400 font-bold">
                      <AlertTriangle className="h-3 w-3" />
                      <span>EXTERNAL LINK</span>
                    </div>
                    We cannot control external content.
                  </div>
                </div>
              ))}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

