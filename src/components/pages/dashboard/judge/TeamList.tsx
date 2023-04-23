import Button from '@/src/components/button';
import Spinner from '@/src/components/spinner';
import {
  EventType,
  PromoteToNextRoundDocument,
  TeamsByRoundDocument,
} from '@/src/generated/generated';
import { idToTeamId } from '@/src/utils/id';
import { useMutation, useQuery } from '@apollo/client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';

type Props = {
  eventId: string;
  roundNo: number;
  eventType: string;
  selectedTeam: string | null;
  setSelectedTeam: React.Dispatch<React.SetStateAction<string | null>>;
};

const TeamList = ({
  eventId,
  roundNo,
  eventType,
  selectedTeam,
  setSelectedTeam,
}: Props) => {
  const [query, setQuery] = React.useState('');

  const { data, loading, error, fetchMore } = useQuery(TeamsByRoundDocument, {
    variables: {
      roundNo,
      eventId,
      first: 20,
      contains: query,
    },
  });

  // as soon as data is available, select the first team
  useEffect(() => {
    if (
      data?.teamsByRound?.__typename === 'QueryTeamsByRoundConnection' &&
      data.teamsByRound.edges.length > 0
    ) {
      setSelectedTeam(data.teamsByRound.edges[0]?.node.id!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const [
    promote,
    { data: promoteData, loading: promoteLoading, error: promoteError },
  ] = useMutation(PromoteToNextRoundDocument, {
    refetchQueries: ['TeamsByRound'],
    awaitRefetchQueries: true,
  });

  const { endCursor, hasNextPage } = data?.teamsByRound.pageInfo || {};
  const lastItemRef = useRef<HTMLDivElement>(null);
  const [isFetching, setIsFetching] = useState(false);
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasNextPage) {
        setIsFetching(true);
        fetchMore({
          variables: { after: endCursor },
          updateQuery: (prevResult, { fetchMoreResult }) => {
            fetchMoreResult.teamsByRound.edges = [
              ...prevResult.teamsByRound.edges,
              ...fetchMoreResult.teamsByRound.edges,
            ];
            setIsFetching(false);
            return fetchMoreResult;
          },
        });
      }
    },
    [endCursor, hasNextPage, fetchMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 1 });
    if (lastItemRef.current) {
      observer.observe(lastItemRef.current);
    }
    let currentRef = lastItemRef.current;
    const updateObserver = () => {
      if (currentRef !== lastItemRef.current) {
        if (currentRef) {
          observer.unobserve(currentRef);
        }

        if (lastItemRef.current) {
          observer.observe(lastItemRef.current);
          currentRef = lastItemRef.current;
        }
      }
    };
    const timeoutId = setInterval(updateObserver, 1000);
    return () => {
      clearInterval(timeoutId);
      observer.disconnect();
    };
  }, [handleObserver, lastItemRef]);

  const teamOrParticipant =
    eventType === 'INDIVIDUAL' || eventType === 'INDIVIDUAL_MULTIPLE_ENTRY'
      ? 'Participant'
      : 'Team';

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 shadow-sm mb-1 rounded-t-lg top-0 sticky bg-[#35436F] flex justify-between">
        <div className="relative w-full mr-5">
          <input
            type={'text'}
            placeholder="Search by name or PID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`bg-white/20 w-full  h-10 px-4 pr-16 rounded-lg text-sm placeholder:text-white/60 focus:outline-none focus:ring-2 ring-white/40`}
          />
          <AiOutlineSearch
            size={'1.4rem'}
            className="absolute right-3 top-2.5 text-white/60"
          />
        </div>
        <Button intent={'success'} noScaleOnHover>Select</Button>
      </div>

      <div className="flex px-3 pb-3 flex-col gap-2 mt-3">
        {loading && <Spinner />}
        {(!loading && !data) ||
          (data?.teamsByRound.edges.length === 0 && (
            <p className="my-3 mt-5 text-gray-400/70 italic text-center">
              No {teamOrParticipant}s found.
            </p>
          ))}
        {data?.teamsByRound.edges.map((team, index) => (
          <div
            key={team?.node.id}
            ref={
              index === data.teamsByRound.edges.length - 1 ? lastItemRef : null
            }
            onClick={() => {
              setSelectedTeam(team?.node.id!);
            }}
            className={`flex items-center p-2 px-5 bg-white/10 rounded-lg ${
              selectedTeam === team?.node.id
                ? 'bg-white/50'
                : 'hover:bg-white/20 transition-colors duration-300'
            }`}
          >
            <div className="flex flex-row gap-5">
              <div
                className={`${
                  selectedTeam === team?.node.id
                    ? 'text-black/80'
                    : 'text-white/80'
                }`}
              >
                {team?.node.name}
              </div>
              <div
                className={`${
                  selectedTeam === team?.node.id
                    ? 'text-black/60'
                    : 'text-white/60'
                }`}
              >
                {idToTeamId(team?.node.id!)}
              </div>
            </div>
          </div>
        ))}
        {isFetching && <Spinner />}
        {!(data?.teamsByRound.edges.length === 0) &&
          !hasNextPage &&
          !loading && (
            <p className="my-3 mt-5 text-gray-400/70 italic text-center">
              no more teams/users to show
            </p>
          )}
      </div>
    </div>
  );
};

export default TeamList;